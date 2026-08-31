export type SupportedLanguage = 
  | 'english' 
  | 'hindi' 
  | 'urdu' 
  | 'roman_hindi' 
  | 'roman_urdu' 
  | 'hinglish';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ToolName =
  // Applications
  | 'open_application'
  | 'close_application'
  | 'restart_application'
  | 'focus_application'
  | 'list_running_applications'
  | 'find_installed_application'
  // VS Code
  | 'detect_vscode'
  | 'open_vscode'
  | 'open_vscode_project'
  | 'open_vscode_file'
  | 'focus_vscode'
  // Filesystem & Projects
  | 'open_folder'
  | 'create_folder'
  | 'rename_folder'
  | 'move_folder'
  | 'copy_folder'
  | 'search_folder'
  | 'list_folder_contents'
  | 'open_file'
  | 'read_file'
  | 'create_file'
  | 'edit_file'
  | 'rename_file'
  | 'move_file'
  | 'copy_file'
  | 'search_file'
  | 'delete_file'
  | 'project_discovery'
  // Terminal
  | 'open_terminal'
  | 'execute_command'
  | 'read_terminal_output'
  | 'stop_process'
  // Browser
  | 'open_browser'
  | 'navigate_browser'
  | 'search_browser'
  | 'close_browser'
  // Keyboard & Mouse
  | 'type_text'
  | 'press_key'
  | 'hotkey'
  | 'move_mouse'
  | 'click'
  | 'double_click'
  | 'right_click'
  | 'scroll'
  // Screen Understanding
  | 'take_screenshot'
  | 'inspect_screen'
  | 'find_visible_text'
  | 'detect_ui_element'
  // System & OS Control
  | 'lock_workstation'
  | 'system_control';

export interface ActionRequest {
  id: string;
  tool: ToolName;
  args: Record<string, any>;
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
  confirmationPrompt?: string;
  description: string;
  timestamp: number;
}

export interface ActionResult<T = any> {
  id: string;
  tool: ToolName;
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  verified?: boolean;
  verificationDetails?: string;
  executionTimeMs?: number;
}

export type StepStatus = 'pending' | 'running' | 'verifying' | 'completed' | 'failed' | 'cancelled' | 'waiting_confirmation';

export interface TaskStep {
  id: string;
  title: string;
  description: string;
  tool?: ToolName;
  args?: Record<string, any>;
  status: StepStatus;
  result?: ActionResult;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface TaskPlan {
  id: string;
  userPrompt: string;
  detectedLanguage: SupportedLanguage;
  summary: string;
  steps: TaskStep[];
  status: 'planning' | 'executing' | 'verifying' | 'completed' | 'failed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: number;
  language?: SupportedLanguage;
  planId?: string;
  steps?: TaskStep[];
  isVoice?: boolean;
  audioUrl?: string;
  requiresConfirmation?: boolean;
  pendingAction?: ActionRequest;
}

export interface ContextMemory {
  currentApplication?: string;
  currentProject?: {
    name: string;
    path: string;
    type?: string;
    lastOpened?: number;
  };
  currentFolder?: string;
  currentFile?: string;
  currentTerminalDirectory?: string;
  activeProcessPid?: number;
  recentProjects: Array<{ name: string; path: string }>;
  recentApplications: string[];
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  lastActivityTime: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  os: string;
  platform: string;
  hostname: string;
  isOnline: boolean;
  lastSeen: number;
  agentVersion: string;
  pairedAt: number;
  status: 'connected' | 'disconnected' | 'pairing';
  capabilities: string[];
}

export interface PermissionPolicy {
  autoApproveLowRisk: boolean;
  alwaysConfirmDelete: boolean;
  alwaysConfirmTerminalCommands: boolean;
  alwaysConfirmSystemChanges: boolean;
  allowedDirectories: string[];
  restrictedCommands: string[];
  allowedApplications: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  userRequest: string;
  tool: ToolName;
  argumentsRedacted: Record<string, any>;
  riskLevel: RiskLevel;
  permissionGranted: boolean;
  executionSuccess: boolean;
  executionTimeMs: number;
  errorMessage?: string;
  deviceId?: string;
}

export interface ActivityEvent {
  type: 'step_start' | 'step_progress' | 'step_verify' | 'step_complete' | 'step_fail' | 'plan_created' | 'plan_complete';
  planId: string;
  stepId?: string;
  title: string;
  description: string;
  status: StepStatus | TaskPlan['status'];
  timestamp: number;
  data?: any;
}
