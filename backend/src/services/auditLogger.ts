import { AuditLogEntry, ActionRequest, ActionResult } from '@war-ai/shared';

export class AuditLogger {
  private static logs: AuditLogEntry[] = [];

  public static logAction(
    userRequest: string,
    request: ActionRequest,
    result: ActionResult,
    deviceId?: string
  ): AuditLogEntry {
    const redactedArgs = this.redactSensitive(request.args);
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      userRequest,
      tool: request.tool,
      argumentsRedacted: redactedArgs,
      riskLevel: request.riskLevel,
      permissionGranted: true,
      executionSuccess: result.success,
      executionTimeMs: result.executionTimeMs || 0,
      errorMessage: result.error,
      deviceId
    };

    this.logs.unshift(entry);
    if (this.logs.length > 500) {
      this.logs.pop();
    }

    console.log(`[AUDIT LOG] [${new Date().toISOString()}] Tool: ${request.tool} | Success: ${result.success} | Risk: ${request.riskLevel} | ms: ${result.executionTimeMs || 0}`);
    return entry;
  }

  private static redactSensitive(args: Record<string, any>): Record<string, any> {
    if (!args) return {};
    const cloned = { ...args };
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'apikey', 'auth'];

    for (const key of Object.keys(cloned)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        cloned[key] = '******** [REDACTED]';
      } else if (typeof cloned[key] === 'string' && cloned[key].length > 500) {
        cloned[key] = cloned[key].substring(0, 500) + '... [TRUNCATED]';
      }
    }

    return cloned;
  }

  public static getLogs(limit: number = 50): AuditLogEntry[] {
    return this.logs.slice(0, limit);
  }
}
