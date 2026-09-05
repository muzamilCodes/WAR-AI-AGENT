import WebSocket from 'ws';
import os from 'os';
import { ActionRequest, ActionResult, DeviceInfo } from '@war-ai/shared';
import { AppController } from '../applications/appController';
import { VSCodeController } from '../vscode/vscodeController';
import { FSController } from '../filesystem/fsController';
import { ProjectDiscovery } from '../filesystem/projectDiscovery';
import { TerminalController } from '../terminal/terminalController';
import { BrowserController } from '../browser/browserController';
import { KeyboardController } from '../keyboard/keyboardController';
import { MouseController } from '../mouse/mouseController';
import { ScreenController } from '../screen/screenController';
import { SystemController } from '../system/systemController';
import { AgentSecurity } from '../security/agentSecurity';

export class AgentWSClient {
  private ws: WebSocket | null = null;
  private backendUrl: string;
  private pairingToken: string;
  private agentName: string;
  private isRunning: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private security: AgentSecurity;

  constructor(backendUrl: string, pairingToken: string = '', agentName: string = 'WAR-Windows-PC') {
    this.backendUrl = backendUrl;
    this.pairingToken = pairingToken;
    this.agentName = agentName;
    this.security = new AgentSecurity();
  }

  public start() {
    this.isRunning = true;
    this.connect();
  }

  public stop() {
    this.isRunning = false;
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      } else {
        this.stopHeartbeat();
        if (this.isRunning) this.scheduleReconnect();
      }
    }, 10000); // Heartbeat every 10 seconds to keep Render proxy alive
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (!this.isRunning) return;
    if (this.reconnectTimer) return;
    this.stopHeartbeat();
    if (this.ws) {
      try { this.ws.terminate(); } catch {}
      this.ws = null;
    }
    console.warn('[WAR Windows Agent] Reconnecting to backend in 2s...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  private connect() {
    if (!this.isRunning) return;

    console.log(`[WAR Windows Agent] Connecting to backend at ${this.backendUrl}...`);
    try {
      this.ws = new WebSocket(this.backendUrl, {
        headers: {
          'x-agent-name': this.agentName,
          'x-pairing-token': this.pairingToken,
          'x-hostname': os.hostname(),
          'x-platform': os.platform()
        }
      });

      this.ws.on('open', () => {
        console.log(`[WAR Windows Agent] ✅ Connected and authenticated with WAR AI Backend.`);
        this.sendDeviceInfo();
        this.startHeartbeat();
      });

      this.ws.on('message', async (data: string) => {
        try {
          const payload = JSON.parse(data.toString());
          if (payload.type === 'execute_tool') {
            await this.handleToolExecution(payload.request);
          } else if (payload.type === 'ping') {
            this.send({ type: 'pong', timestamp: Date.now() });
          } else if (payload.type === 'pong') {
            // Heartbeat confirmed
          }
        } catch (err: any) {
          console.error('[WAR Windows Agent] Error handling message:', err.message);
        }
      });

      this.ws.on('close', () => {
        console.warn('[WAR Windows Agent] Disconnected from backend.');
        this.scheduleReconnect();
      });

      this.ws.on('error', (err) => {
        console.error('[WAR Windows Agent] Connection error:', err.message);
        this.scheduleReconnect();
      });
    } catch (err: any) {
      console.error('[WAR Windows Agent] Connection setup failed:', err.message);
      this.scheduleReconnect();
    }
  }

  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private sendDeviceInfo() {
    const info: DeviceInfo = {
      id: `dev_${os.hostname().toLowerCase()}`,
      name: this.agentName,
      os: `${os.type()} ${os.release()}`,
      platform: os.platform(),
      hostname: os.hostname(),
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

    this.send({ type: 'device_info', info });
  }

  public async executeToolDirectly(request: ActionRequest): Promise<ActionResult> {
    const { tool, args = {} } = request;
    console.log(`[WAR Windows Agent] Executing tool: "${tool}" with args:`, args);

    try {
      switch (tool) {
        // App Controller
        case 'open_application':
          return await AppController.openApplication(args.name, args.args);
        case 'close_application':
          return await AppController.closeApplication(args.name, args.force);
        case 'restart_application':
          return await AppController.restartApplication(args.name);
        case 'focus_application':
          return await AppController.focusApplication(args.name);
        case 'list_running_applications':
          return await AppController.listRunningApplications();
        case 'find_installed_application':
          return await AppController.findInstalledApplication(args.query || args.name);

        // VS Code
        case 'detect_vscode':
          const det = await VSCodeController.detectVSCode();
          return {
            id: request.id,
            tool,
            success: det.installed,
            message: det.installed ? `VS Code detected at "${det.path}"` : 'VS Code not detected',
            data: det,
            verified: true
          };
        case 'open_vscode':
          return await VSCodeController.openVSCode(args.path, args.newWindow);
        case 'open_vscode_project':
          return await VSCodeController.openVSCodeProject(args.path);
        case 'open_vscode_file':
          return await VSCodeController.openVSCodeFile(args.path, args.line);
        case 'focus_vscode':
          return await VSCodeController.focusVSCode();

        // Filesystem & Projects
        case 'project_discovery':
          return await ProjectDiscovery.discoverProjects(args.name || args.query, args.searchLocations);
        case 'open_folder':
          return await FSController.openFolder(args.path);
        case 'create_folder':
          return await FSController.createFolder(args.path);
        case 'rename_folder':
          return await FSController.renameFolder(args.source, args.newName);
        case 'move_folder':
          return await FSController.moveFolder(args.source, args.destination);
        case 'copy_folder':
          return await FSController.copyFolder(args.source, args.destination);
        case 'list_folder_contents':
          return await FSController.listFolderContents(args.path, args.depth);
        case 'open_file':
          return await FSController.openFile(args.path);
        case 'read_file':
          return await FSController.readFile(args.path, args.maxLength);
        case 'create_file':
          return await FSController.createFile(args.path, args.content);
        case 'edit_file':
          return await FSController.editFile(args.path, args.changes, args.mode);
        case 'delete_file':
          return await FSController.deleteFile(args.path, args.permanent);

        // Terminal
        case 'open_terminal':
          return await TerminalController.openTerminal(args.cwd);
        case 'execute_command': {
          const check = this.security.validateCommand(args.command);
          if (!check.isSafe) {
            return {
              id: request.id,
              tool,
              success: false,
              message: `Security block: ${check.reason}`,
              error: check.reason,
              verified: false
            };
          }
          return await TerminalController.executeCommand(args.command, args.cwd, args.timeoutMs, args.runInBackground);
        }
        case 'read_terminal_output':
          return await TerminalController.readTerminalOutput();
        case 'stop_process':
          return await TerminalController.stopProcess(args.pid, args.name);

        // Browser
        case 'open_browser':
          return await BrowserController.openBrowser(args.url);
        case 'navigate_browser':
          return await BrowserController.navigateBrowser(args.url);
        case 'search_browser':
          return await BrowserController.searchBrowser(args.query, args.engine);
        case 'close_browser':
          return await BrowserController.closeBrowser();

        // Keyboard & Mouse
        case 'type_text':
          return await KeyboardController.typeText(args.text);
        case 'press_key':
          return await KeyboardController.pressKey(args.key);
        case 'hotkey':
          return await KeyboardController.hotkey(args.keys);
        case 'move_mouse':
          return await MouseController.moveMouse(args.x, args.y);
        case 'click':
          return await MouseController.click(args.x, args.y);
        case 'double_click':
          return await MouseController.doubleClick(args.x, args.y);
        case 'right_click':
          return await MouseController.rightClick(args.x, args.y);
        case 'scroll':
          return await MouseController.scroll(args.direction, args.amount);

        // Screen
        case 'take_screenshot':
          return await ScreenController.takeScreenshot(args.customPath);
        case 'inspect_screen':
          return await ScreenController.inspectScreen();
        case 'find_visible_text':
          return await ScreenController.findVisibleText(args.text);

        // System & Workstation Control
        case 'lock_workstation':
          return await SystemController.lockWorkstation();
        case 'system_control':
          if (args.action === 'lock') return await SystemController.lockWorkstation();
          if (args.action === 'minimize_all') return await SystemController.minimizeAll();
          if (args.action === 'volume_up') return await SystemController.controlVolume('up');
          if (args.action === 'volume_down') return await SystemController.controlVolume('down');
          if (args.action === 'mute') return await SystemController.controlVolume('mute');
          if (['settings', 'task_manager', 'recycle_bin'].includes(args.action)) {
            return await SystemController.openSystemUtility(args.action);
          }
          return await SystemController.lockWorkstation();

        default:
          return {
            id: request.id,
            tool,
            success: false,
            message: `Unknown or unsupported tool "${tool}"`,
            error: 'TOOL_NOT_SUPPORTED',
            verified: false
          };
      }
    } catch (err: any) {
      return {
        id: request.id,
        tool,
        success: false,
        message: `Execution failed for "${tool}": ${err.message}`,
        error: err.message,
        verified: false
      };
    }
  }

  private async handleToolExecution(request: ActionRequest) {
    const result = await this.executeToolDirectly(request);
    this.send({
      type: 'tool_result',
      requestId: request.id,
      result
    });
  }
}
