import path from 'path';
import { COMMAND_SECURITY_BLACKLIST } from '@war-ai/shared';

export class AgentSecurity {
  private allowedDirectories: string[] = [];
  private restrictedCommands: string[] = COMMAND_SECURITY_BLACKLIST;

  constructor(allowedDirs?: string[], restrictedCmds?: string[]) {
    if (allowedDirs && allowedDirs.length > 0) {
      this.allowedDirectories = allowedDirs.map(d => path.resolve(d.toLowerCase()));
    }
    if (restrictedCmds && restrictedCmds.length > 0) {
      this.restrictedCommands = restrictedCmds.map(c => c.toLowerCase());
    }
  }

  public validateCommand(command: string): { isSafe: boolean; reason?: string } {
    const cmdLower = command.toLowerCase().trim();

    for (const dangerous of this.restrictedCommands) {
      if (cmdLower.includes(dangerous)) {
        return {
          isSafe: false,
          reason: `Command contains blacklisted destructive pattern: "${dangerous}"`
        };
      }
    }

    // Block disk wiping patterns
    if (/\bformat\s+[a-z]:/i.test(command) || /\bdel\s+\/f\s+\/s\s+\/q\s+[c-z]:\\/i.test(command)) {
      return {
        isSafe: false,
        reason: 'Command attempted destructive disk formatting or recursive root deletion'
      };
    }

    return { isSafe: true };
  }

  public validatePath(targetPath: string): { isAllowed: boolean; resolvedPath: string; reason?: string } {
    const resolved = path.resolve(targetPath);
    const resolvedLower = resolved.toLowerCase();

    // Prevent system32 / Windows direct tampering
    const windowsDir = (process.env.WINDIR || 'C:\\Windows').toLowerCase();
    const system32 = path.join(windowsDir, 'system32').toLowerCase();

    if (resolvedLower.startsWith(system32) && !resolvedLower.includes('cmd.exe') && !resolvedLower.includes('powershell.exe')) {
      return {
        isAllowed: false,
        resolvedPath: resolved,
        reason: 'Access to System32 is restricted for safety'
      };
    }

    return { isAllowed: true, resolvedPath: resolved };
  }
}
