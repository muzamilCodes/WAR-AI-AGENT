import { RiskLevel, ToolName } from '../types';

export const TOOL_RISK_MAP: Record<ToolName, RiskLevel> = {
  // Low Risk: Read-only, inspection, discovery, opening existing apps
  find_installed_application: 'LOW',
  list_running_applications: 'LOW',
  open_application: 'LOW',
  focus_application: 'LOW',
  detect_vscode: 'LOW',
  open_vscode: 'LOW',
  open_vscode_project: 'LOW',
  open_vscode_file: 'LOW',
  focus_vscode: 'LOW',
  open_folder: 'LOW',
  search_folder: 'LOW',
  list_folder_contents: 'LOW',
  project_discovery: 'LOW',
  open_file: 'LOW',
  read_file: 'LOW',
  search_file: 'LOW',
  open_browser: 'LOW',
  navigate_browser: 'LOW',
  search_browser: 'LOW',
  take_screenshot: 'LOW',
  inspect_screen: 'LOW',
  find_visible_text: 'LOW',
  detect_ui_element: 'LOW',
  read_terminal_output: 'LOW',

  // Medium Risk: Creation, benign interaction, typing, clicking
  create_folder: 'MEDIUM',
  create_file: 'MEDIUM',
  edit_file: 'MEDIUM',
  rename_folder: 'MEDIUM',
  rename_file: 'MEDIUM',
  copy_folder: 'MEDIUM',
  copy_file: 'MEDIUM',
  move_folder: 'MEDIUM',
  move_file: 'MEDIUM',
  open_terminal: 'MEDIUM',
  type_text: 'MEDIUM',
  press_key: 'MEDIUM',
  hotkey: 'MEDIUM',
  move_mouse: 'MEDIUM',
  click: 'MEDIUM',
  double_click: 'MEDIUM',
  right_click: 'MEDIUM',
  scroll: 'MEDIUM',
  close_browser: 'MEDIUM',
  restart_application: 'MEDIUM',

  // High Risk: Destructive, process termination, arbitrary commands, deletion
  close_application: 'HIGH',
  delete_file: 'HIGH',
  execute_command: 'HIGH',
  stop_process: 'HIGH'
};

export const COMMAND_SECURITY_BLACKLIST = [
  'rmdir /s /q c:',
  'del /f /s /q c:',
  'format c:',
  'diskpart',
  'reg delete',
  'rm -rf /',
  'drop database',
  ':(){ :|:& };:',
  'shutdown /s',
  'bcdedit'
];

export const SAFE_DEFAULT_PERMISSIONS = {
  autoApproveLowRisk: true,
  alwaysConfirmDelete: true,
  alwaysConfirmTerminalCommands: false, // will confirm if dangerous keywords present
  alwaysConfirmSystemChanges: true,
  allowedDirectories: [
    'Desktop',
    'Documents',
    'Downloads',
    'OneDrive',
    'Projects',
    'workspace',
    'dev'
  ],
  restrictedCommands: COMMAND_SECURITY_BLACKLIST,
  allowedApplications: [
    'code',
    'vscode',
    'chrome',
    'msedge',
    'firefox',
    'notepad',
    'explorer',
    'powershell',
    'cmd',
    'spotify',
    'slack',
    'discord',
    'terminal'
  ]
};
