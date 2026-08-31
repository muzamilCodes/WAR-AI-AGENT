import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { AgentBrain } from '../agent/brain';
import { DeviceManager } from './deviceManager';
import { DeviceInfo } from '@war-ai/shared';

export class WSHub {
  private wss: WebSocketServer;
  private brain: AgentBrain;
  private deviceManager: DeviceManager;
  private clientSockets: Set<WebSocket> = new Set();

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server });
    this.brain = AgentBrain.getInstance();
    this.deviceManager = DeviceManager.getInstance();

    this.initialize();
  }

  private initialize() {
    // Listen for agent activity events from the brain and broadcast to all connected UI clients
    this.brain.onActivity((event) => {
      this.broadcastToClients({
        type: 'activity_event',
        event
      });
    });

    this.wss.on('connection', (socket: WebSocket, req: http.IncomingMessage) => {
      const url = req.url || '';

      // Check if this connection is from a local Windows Agent
      if (url.startsWith('/agent')) {
        const headers = req.headers;
        const agentName = (headers['x-agent-name'] as string) || 'WAR-Windows-PC';
        const hostname = (headers['x-hostname'] as string) || 'Windows-Host';
        const platform = (headers['x-platform'] as string) || 'win32';

        const deviceInfo: DeviceInfo = {
          id: `dev_${hostname.toLowerCase()}`,
          name: agentName,
          os: 'Windows 11 Pro',
          platform,
          hostname,
          isOnline: true,
          lastSeen: Date.now(),
          agentVersion: '1.0.0',
          pairedAt: Date.now(),
          status: 'connected',
          capabilities: [
            'applications',
            'vscode',
            'filesystem',
            'project_discovery',
            'terminal',
            'browser',
            'keyboard',
            'mouse',
            'screen_capture',
            'action_verification'
          ]
        };

        this.deviceManager.registerAgent(socket, deviceInfo);
        this.broadcastDeviceStatus();

        socket.on('close', () => {
          this.broadcastDeviceStatus();
        });

        return;
      }

      // Otherwise it's a browser / frontend client
      this.clientSockets.add(socket);
      console.log(`[WSHub] UI Client connected (Total active UI clients: ${this.clientSockets.size})`);

      // Send initial status to client
      socket.send(JSON.stringify({
        type: 'init_state',
        devices: this.deviceManager.getConnectedDevices(),
        context: this.brain.getContext()
      }));

      socket.on('message', async (data: string) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'chat_message') {
            const result = await this.brain.processUserMessage(msg.text, msg.isVoice, msg.language);
            socket.send(JSON.stringify({
              type: 'chat_response',
              result
            }));
          } else if (msg.type === 'confirm_action') {
            const result = await this.brain.handleConfirmationDecision(msg.actionRequest, msg.approved, msg.planId);
            socket.send(JSON.stringify({
              type: 'confirmation_result',
              result
            }));
          }
        } catch (err: any) {
          console.error('[WSHub] Error processing client message:', err.message);
        }
      });

      socket.on('close', () => {
        this.clientSockets.delete(socket);
        console.log(`[WSHub] UI Client disconnected (Remaining: ${this.clientSockets.size})`);
      });
    });
  }

  public broadcastToClients(data: any) {
    const payload = JSON.stringify(data);
    for (const socket of this.clientSockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }

  public broadcastDeviceStatus() {
    this.broadcastToClients({
      type: 'device_status_update',
      devices: this.deviceManager.getConnectedDevices()
    });
  }
}
