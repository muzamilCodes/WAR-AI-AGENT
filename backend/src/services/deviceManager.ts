import WebSocket from 'ws';
import { DeviceInfo, ActionRequest, ActionResult } from '@war-ai/shared';

interface AgentConnection {
  socket: WebSocket;
  deviceInfo: DeviceInfo;
  pendingRequests: Map<string, {
    resolve: (result: ActionResult) => void;
    reject: (err: any) => void;
    timer: NodeJS.Timeout;
  }>;
}

export class DeviceManager {
  private static instance: DeviceManager;
  private agents: Map<string, AgentConnection> = new Map();
  private pairingCodes: Map<string, { expiresAt: number; token: string }> = new Map();

  public static getInstance(): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }
    return DeviceManager.instance;
  }

  public registerAgent(socket: WebSocket, info: DeviceInfo): string {
    const connectionId = info.id || `dev_${Date.now()}`;
    
    // Clean up previous socket if existing
    const existing = this.agents.get(connectionId);
    if (existing && existing.socket !== socket) {
      try {
        existing.socket.terminate();
      } catch {}
    }

    const agentConn: AgentConnection = {
      socket,
      deviceInfo: { ...info, isOnline: true, lastSeen: Date.now() },
      pendingRequests: new Map()
    };

    this.agents.set(connectionId, agentConn);
    console.log(`[DeviceManager] Windows Device registered: "${info.name}" (${info.hostname}) - ID: ${connectionId}`);

    socket.on('message', (data: string) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.type === 'ping') {
          agentConn.deviceInfo.isOnline = true;
          agentConn.deviceInfo.lastSeen = Date.now();
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
          return;
        }

        if (payload.type === 'tool_result' && payload.requestId) {
          const pending = agentConn.pendingRequests.get(payload.requestId);
          if (pending) {
            clearTimeout(pending.timer);
            agentConn.pendingRequests.delete(payload.requestId);
            pending.resolve(payload.result);
          }
        } else if (payload.type === 'device_info' && payload.info) {
          agentConn.deviceInfo = { ...payload.info, isOnline: true, lastSeen: Date.now() };
        }
      } catch (err: any) {
        console.error('[DeviceManager] Error handling agent message:', err.message);
      }
    });

    socket.on('close', () => {
      console.warn(`[DeviceManager] Device disconnected: ${connectionId}`);
      const ag = this.agents.get(connectionId);
      if (ag && ag.socket === socket) {
        ag.deviceInfo.isOnline = false;
        ag.deviceInfo.lastSeen = Date.now();
      }
    });

    socket.on('error', (err) => {
      console.error(`[DeviceManager] Socket error for ${connectionId}:`, err.message);
      const ag = this.agents.get(connectionId);
      if (ag && ag.socket === socket) {
        ag.deviceInfo.isOnline = false;
      }
    });

    return connectionId;
  }

  public getConnectedDevices(): DeviceInfo[] {
    return Array.from(this.agents.values()).map(a => a.deviceInfo);
  }

  public getActiveDevice(): AgentConnection | null {
    for (const conn of this.agents.values()) {
      if (conn.deviceInfo.isOnline && conn.socket.readyState === WebSocket.OPEN) {
        return conn;
      }
    }
    return null;
  }

  public generatePairingCode(): { code: string; token: string; expiresAt: number } {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = `pair_tok_${Math.random().toString(36).substring(2, 12)}`;
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.pairingCodes.set(code, { token, expiresAt });
    return { code, token, expiresAt };
  }

  public async executeOnDevice(request: ActionRequest, timeoutMs: number = 35000): Promise<ActionResult> {
    const active = this.getActiveDevice();
    if (!active) {
      return {
        id: request.id,
        tool: request.tool,
        success: false,
        message: 'No Windows Agent is currently connected. Please ensure the local Windows Agent is running.',
        error: 'DEVICE_OFFLINE',
        verified: false
      };
    }

    return new Promise<ActionResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        active.pendingRequests.delete(request.id);
        resolve({
          id: request.id,
          tool: request.tool,
          success: false,
          message: `Action timed out waiting for Windows Agent response (${timeoutMs}ms)`,
          error: 'TIMEOUT',
          verified: false
        });
      }, timeoutMs);

      active.pendingRequests.set(request.id, { resolve, reject, timer });

      try {
        active.socket.send(JSON.stringify({
          type: 'execute_tool',
          request
        }));
      } catch (err: any) {
        clearTimeout(timer);
        active.pendingRequests.delete(request.id);
        resolve({
          id: request.id,
          tool: request.tool,
          success: false,
          message: `Failed to dispatch tool to Windows Agent: ${err.message}`,
          error: err.message,
          verified: false
        });
      }
    });
  }
}
