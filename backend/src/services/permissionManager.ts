import { ActionRequest, PermissionPolicy, RiskLevel, ToolName, TOOL_RISK_MAP, SAFE_DEFAULT_PERMISSIONS } from '@war-ai/shared';

export class PermissionManager {
  private policy: PermissionPolicy;

  constructor(customPolicy?: Partial<PermissionPolicy>) {
    this.policy = {
      ...SAFE_DEFAULT_PERMISSIONS,
      ...customPolicy
    };
  }

  public evaluateAction(tool: ToolName, args: Record<string, any>, description: string): ActionRequest {
    const riskLevel = this.determineRisk(tool, args);
    const requiresConfirmation = this.requiresUserConfirmation(tool, args, riskLevel);
    const confirmationPrompt = requiresConfirmation ? this.generateConfirmationPrompt(tool, args) : undefined;

    return {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tool,
      args,
      riskLevel,
      requiresConfirmation,
      confirmationPrompt,
      description,
      timestamp: Date.now()
    };
  }

  private determineRisk(tool: ToolName, args: Record<string, any>): RiskLevel {
    const baseRisk = TOOL_RISK_MAP[tool] || 'MEDIUM';

    // High risk checks for terminal commands
    if (tool === 'execute_command') {
      const cmd = (args.command || '').toLowerCase();
      if (cmd.includes('rm ') || cmd.includes('del ') || cmd.includes('remove-item') || cmd.includes('kill') || cmd.includes('shutdown')) {
        return 'HIGH';
      }
      if (cmd.includes('npm install') || cmd.includes('git clone')) {
        return 'MEDIUM';
      }
    }

    if (tool === 'delete_file') {
      return 'HIGH';
    }

    return baseRisk;
  }

  private requiresUserConfirmation(tool: ToolName, args: Record<string, any>, risk: RiskLevel): boolean {
    if (risk === 'HIGH' || risk === 'CRITICAL') {
      return true;
    }

    if (tool === 'delete_file' && this.policy.alwaysConfirmDelete) {
      return true;
    }

    if (tool === 'execute_command') {
      const cmd = (args.command || '').toLowerCase();
      const dangerous = ['delete', 'remove', 'format', 'drop', 'wipe', 'reset --hard'];
      if (dangerous.some(d => cmd.includes(d))) {
        return true;
      }
    }

    return false;
  }

  private generateConfirmationPrompt(tool: ToolName, args: Record<string, any>): string {
    switch (tool) {
      case 'delete_file':
        return `Boss, ye file permanently delete hone wali hai: "${args.path}". Confirm karun? (Yes / No)`;
      case 'close_application':
        return `Boss, application "${args.name}" ko close karun? Unsaved work lose ho sakta hai.`;
      case 'execute_command':
        return `Boss, high-risk command execute hone wala hai: "${args.command}". Confirm karun?`;
      case 'stop_process':
        return `Boss, process PID ${args.pid || args.name} terminate karun?`;
      default:
        return `Boss, is action ko confirm karna chahte hain?`;
    }
  }

  public getPolicy(): PermissionPolicy {
    return { ...this.policy };
  }

  public updatePolicy(updates: Partial<PermissionPolicy>) {
    this.policy = { ...this.policy, ...updates };
  }
}
