import { ActionResult } from '@war-ai/shared';
import { runPowerShell, runPowerShellJson } from '../utils/powershell';
import { ActionVerifier } from '../verification/actionVerifier';

export class AppController {
  public static async openApplication(name: string, args: string[] = []): Promise<ActionResult> {
    const startTime = Date.now();
    const argString = args.length > 0 ? args.map(a => `"${a}"`).join(' ') : '';
    
    // Check if it's already running
    const checkRunning = await ActionVerifier.verifyProcessRunning(name, 500);
    if (checkRunning.verified) {
      await this.focusApplication(name);
      return {
        id: `open_app_${Date.now()}`,
        tool: 'open_application',
        success: true,
        message: `Application "${name}" was already running and has been brought to the foreground`,
        verified: true,
        verificationDetails: checkRunning.details,
        executionTimeMs: Date.now() - startTime
      };
    }

    // Try starting via Start-Process
    const script = `Start-Process -FilePath "${name}" ${argString ? `-ArgumentList ${argString}` : ''} -ErrorAction Stop`;
    const launchResult = await runPowerShell(script, 10000);

    if (launchResult.code !== 0) {
      // Fallback: try explorer.exe or cmd /c start
      const fallbackScript = `Start-Process "cmd.exe" -ArgumentList "/c start ${name}" -WindowStyle Hidden`;
      await runPowerShell(fallbackScript, 5000);
    }

    // Mandatory verification
    const verification = await ActionVerifier.verifyProcessRunning(name, 5000);
    const executionTimeMs = Date.now() - startTime;

    if (verification.verified) {
      return {
        id: `open_app_${Date.now()}`,
        tool: 'open_application',
        success: true,
        message: `Successfully launched and verified application "${name}"`,
        data: { pid: verification.pid },
        verified: true,
        verificationDetails: verification.details,
        executionTimeMs
      };
    } else {
      return {
        id: `open_app_${Date.now()}`,
        tool: 'open_application',
        success: false,
        message: `Failed to open or verify application "${name}"`,
        error: launchResult.stderr || verification.details,
        verified: false,
        executionTimeMs
      };
    }
  }

  public static async closeApplication(name: string, force: boolean = false): Promise<ActionResult> {
    const startTime = Date.now();
    const cleanName = name.replace(/\.exe$/i, '');
    const forceFlag = force ? '-Force' : '';

    const script = `Stop-Process -Name "${cleanName}" ${forceFlag} -ErrorAction SilentlyContinue`;
    await runPowerShell(script, 5000);

    const verification = await ActionVerifier.verifyProcessTerminated(cleanName, 4000);
    const executionTimeMs = Date.now() - startTime;

    return {
      id: `close_app_${Date.now()}`,
      tool: 'close_application',
      success: verification.verified,
      message: verification.verified
        ? `Application "${name}" closed successfully`
        : `Could not verify closing of "${name}"`,
      verified: verification.verified,
      verificationDetails: verification.details,
      executionTimeMs
    };
  }

  public static async restartApplication(name: string): Promise<ActionResult> {
    await this.closeApplication(name, true);
    await ActionVerifier.sleep(1000);
    return await this.openApplication(name);
  }

  public static async focusApplication(name: string): Promise<ActionResult> {
    const startTime = Date.now();
    const cleanName = name.replace(/\.exe$/i, '');

    const script = `
      $proc = Get-Process -Name "${cleanName}" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
      if ($proc) {
        $wshell = New-Object -ComObject WScript.Shell
        $wshell.AppActivate($proc.Id)
        "focused"
      } else {
        "not_found"
      }
    `;

    const result = await runPowerShell(script, 5000);
    const success = result.stdout.includes('focused');

    return {
      id: `focus_app_${Date.now()}`,
      tool: 'focus_application',
      success,
      message: success
        ? `Focused window for "${name}"`
        : `Could not find an active window for "${name}"`,
      verified: success,
      executionTimeMs: Date.now() - startTime
    };
  }

  public static async listRunningApplications(): Promise<ActionResult> {
    const startTime = Date.now();
    const script = `
      Get-Process | Where-Object { $_.MainWindowTitle -ne "" } | 
      Select-Object -Property Id, ProcessName, MainWindowTitle, WorkingSet64 |
      Sort-Object -Property MainWindowTitle
    `;

    try {
      const apps = await runPowerShellJson<any[]>(script, 5000);
      const formatted = Array.isArray(apps) ? apps : (apps ? [apps] : []);
      return {
        id: `list_apps_${Date.now()}`,
        tool: 'list_running_applications',
        success: true,
        message: `Found ${formatted.length} active application windows`,
        data: formatted.map(a => ({
          pid: a.Id,
          name: a.ProcessName,
          title: a.MainWindowTitle,
          memoryMb: Math.round((a.WorkingSet64 || 0) / (1024 * 1024))
        })),
        verified: true,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        id: `list_apps_${Date.now()}`,
        tool: 'list_running_applications',
        success: false,
        message: `Failed to list running applications: ${err.message}`,
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  public static async findInstalledApplication(query: string): Promise<ActionResult> {
    const startTime = Date.now();
    const script = `
      $paths = @(
        "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
        "HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*",
        "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*"
      )
      Get-ItemProperty $paths -ErrorAction SilentlyContinue |
      Where-Object { $_.DisplayName -like "*${query}*" } |
      Select-Object -Property DisplayName, DisplayVersion, InstallLocation, Publisher |
      Select-Object -Unique -Property DisplayName
    `;

    try {
      const found = await runPowerShellJson<any[]>(script, 6000);
      const items = Array.isArray(found) ? found : (found ? [found] : []);
      return {
        id: `find_app_${Date.now()}`,
        tool: 'find_installed_application',
        success: true,
        message: `Found ${items.length} matching installed applications for "${query}"`,
        data: items,
        verified: true,
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      return {
        id: `find_app_${Date.now()}`,
        tool: 'find_installed_application',
        success: false,
        message: `Error searching installed applications: ${err.message}`,
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}
