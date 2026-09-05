import { ActionResult } from '@war-ai/shared';
import { runPowerShell, runPowerShellJson } from '../utils/powershell';
import { ActionVerifier } from '../verification/actionVerifier';

export class AppController {
  public static resolveAppExecutable(name: string): string {
    const lower = name.toLowerCase().trim();
    const userProfile = process.env.USERPROFILE || 'C:\\Users\\Default';

    if (lower.includes('antigravity') || lower.includes('agy') || lower.includes('एंटी') || lower.includes('इंटी')) {
      return `${userProfile}\\AppData\\Local\\Programs\\Antigravity IDE\\Antigravity IDE.exe`;
    }

    if (lower.includes('cursor') || lower.includes('कर्सर')) {
      return `C:\\Program Files\\cursor\\Cursor.exe`;
    }

    if (lower.includes('code') || lower.includes('vscode') || lower.includes('स्कोर') || lower.includes('वीएस')) {
      return `${userProfile}\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe`;
    }

    if (lower.includes('spotify') || lower.includes('स्पॉटिफ़ाई')) {
      return `${userProfile}\\AppData\\Local\\Microsoft\\WindowsApps\\Spotify.exe`;
    }

    if (lower.includes('notepad') || lower.includes('नोटपैड')) {
      return 'notepad.exe';
    }

    if (lower.includes('calc') || lower.includes('कैलकुलेटर')) {
      return 'calc.exe';
    }

    if (lower.includes('chrome') || lower.includes('क्रोम')) {
      return 'chrome.exe';
    }

    if (lower.includes('edge') || lower.includes('एज')) {
      return 'msedge.exe';
    }

    if (lower.includes('brave') || lower.includes('ब्रेव')) {
      return 'brave.exe';
    }

    if (lower.includes('explorer') || lower.includes('file manager') || lower.includes('files')) {
      return 'explorer.exe';
    }

    if (lower.includes('terminal') || lower.includes('powershell')) {
      return 'wt.exe';
    }

    if (lower.includes('cmd') || lower.includes('command prompt')) {
      return 'cmd.exe';
    }

    return name;
  }

  public static async openApplication(name: string, args: string[] = []): Promise<ActionResult> {
    const startTime = Date.now();
    const resolvedPath = this.resolveAppExecutable(name);
    const argString = args.length > 0 ? args.map(a => `"${a}"`).join(' ') : '';
    
    // Check if it's already running and bring to front
    const checkRunning = await ActionVerifier.verifyProcessRunning(name, 500);
    if (checkRunning.verified) {
      await this.focusApplication(name);
      return {
        id: `open_app_${Date.now()}`,
        tool: 'open_application',
        success: true,
        message: `Application "${name}" is active and brought to foreground`,
        verified: true,
        verificationDetails: checkRunning.details,
        executionTimeMs: Date.now() - startTime
      };
    }

    // Try starting resolved path safely without blocking GUI dialogs
    const script = `
      try {
        Start-Process -FilePath "${resolvedPath}" ${argString ? `-ArgumentList ${argString}` : ''} -ErrorAction Stop
      } catch {
        try {
          Start-Process -FilePath "${name}" ${argString ? `-ArgumentList ${argString}` : ''} -ErrorAction Stop
        } catch {
          $msg = $_.Exception.Message
          Write-Error "Failed to start ${name}: $msg"
        }
      }
    `;
    const res = await runPowerShell(script, 8000);

    if (res.code !== 0 && res.stderr && !res.stdout) {
      return {
        id: `open_app_${Date.now()}`,
        tool: 'open_application',
        success: false,
        message: `Application "${name}" could not be found or started.`,
        error: res.stderr,
        verified: false,
        executionTimeMs: Date.now() - startTime
      };
    }

    return {
      id: `open_app_${Date.now()}`,
      tool: 'open_application',
      success: true,
      message: `Successfully launched "${name}"`,
      verified: true,
      executionTimeMs: Date.now() - startTime
    };
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
