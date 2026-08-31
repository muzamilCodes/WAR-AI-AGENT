import fs from 'fs';
import path from 'path';
import { ActionResult } from '@war-ai/shared';
import { runPowerShell } from '../utils/powershell';
import { ActionVerifier } from '../verification/actionVerifier';

export class VSCodeController {
  private static cachedVSCodePath: string | null = null;

  public static async detectVSCode(): Promise<{ installed: boolean; path?: string }> {
    if (this.cachedVSCodePath && fs.existsSync(this.cachedVSCodePath)) {
      return { installed: true, path: this.cachedVSCodePath };
    }

    // 1. Check Standard User Installation (AppData\Local\Programs\Microsoft VS Code\Code.exe)
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'AppData', 'Local');
    const userCodePath = path.join(localAppData, 'Programs', 'Microsoft VS Code', 'Code.exe');
    if (fs.existsSync(userCodePath)) {
      this.cachedVSCodePath = userCodePath;
      return { installed: true, path: userCodePath };
    }

    // 2. Check System-wide 64-bit Program Files
    const progFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
    const sysCodePath = path.join(progFiles, 'Microsoft VS Code', 'Code.exe');
    if (fs.existsSync(sysCodePath)) {
      this.cachedVSCodePath = sysCodePath;
      return { installed: true, path: sysCodePath };
    }

    // 3. Check Program Files (x86)
    const progFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const x86CodePath = path.join(progFilesX86, 'Microsoft VS Code', 'Code.exe');
    if (fs.existsSync(x86CodePath)) {
      this.cachedVSCodePath = x86CodePath;
      return { installed: true, path: x86CodePath };
    }

    // 4. Check VS Code Insiders
    const userInsidersPath = path.join(localAppData, 'Programs', 'Microsoft VS Code Insiders', 'Code - Insiders.exe');
    if (fs.existsSync(userInsidersPath)) {
      this.cachedVSCodePath = userInsidersPath;
      return { installed: true, path: userInsidersPath };
    }

    // 5. Check where.exe code / Code.exe
    const whereResult = await runPowerShell('where.exe code.exe Code code', 3000);
    if (whereResult.code === 0 && whereResult.stdout) {
      const paths = whereResult.stdout.split('\r\n').map(p => p.trim());
      // First look for direct .exe
      const exePath = paths.find(p => p.toLowerCase().endsWith('.exe'));
      if (exePath && fs.existsSync(exePath)) {
        this.cachedVSCodePath = exePath;
        return { installed: true, path: exePath };
      }
      // If code.cmd found, check if Code.exe is in parent directory
      const cmdPath = paths.find(p => p.toLowerCase().endsWith('.cmd'));
      if (cmdPath) {
        const potentialExe = path.resolve(path.dirname(cmdPath), '..', 'Code.exe');
        if (fs.existsSync(potentialExe)) {
          this.cachedVSCodePath = potentialExe;
          return { installed: true, path: potentialExe };
        }
        this.cachedVSCodePath = cmdPath;
        return { installed: true, path: cmdPath };
      }
    }

    return { installed: false };
  }

  public static async openVSCode(targetPath?: string, newWindow: boolean = false): Promise<ActionResult> {
    const startTime = Date.now();
    const detection = await this.detectVSCode();

    if (!detection.installed || !detection.path) {
      return {
        id: `vscode_${Date.now()}`,
        tool: 'open_vscode',
        success: false,
        message: 'VS Code is not installed or could not be detected on this machine',
        verified: false,
        executionTimeMs: Date.now() - startTime
      };
    }

    const resolvedTarget = targetPath ? path.resolve(targetPath) : '';
    const newWinFlag = newWindow ? '-n' : '';
    const argList = [newWinFlag, resolvedTarget ? `"${resolvedTarget}"` : ''].filter(Boolean).join(' ');

    let script = '';
    if (detection.path.toLowerCase().endsWith('.exe')) {
      script = `Start-Process -FilePath "${detection.path}" ${argList ? `-ArgumentList '${argList}'` : ''}`;
    } else {
      script = `Start-Process -FilePath "cmd.exe" -ArgumentList '/c "${detection.path}" ${argList}' -WindowStyle Hidden`;
    }

    await runPowerShell(script, 8000);

    const verification = await ActionVerifier.verifyProcessRunning('Code', 6000);
    const executionTimeMs = Date.now() - startTime;

    return {
      id: `vscode_${Date.now()}`,
      tool: 'open_vscode',
      success: verification.verified,
      message: verification.verified
        ? targetPath ? `VS Code opened with "${targetPath}"` : 'VS Code opened successfully'
        : 'Could not verify that VS Code started',
      data: { path: detection.path, targetPath },
      verified: verification.verified,
      verificationDetails: verification.details,
      executionTimeMs
    };
  }

  public static async openVSCodeProject(projectPath: string): Promise<ActionResult> {
    return await this.openVSCode(projectPath, false);
  }

  public static async openVSCodeFile(filePath: string, line?: number): Promise<ActionResult> {
    const target = line ? `-g "${path.resolve(filePath)}:${line}"` : `"${path.resolve(filePath)}"`;
    const detection = await this.detectVSCode();
    if (!detection.installed) {
      return {
        id: `vscode_file_${Date.now()}`,
        tool: 'open_vscode_file',
        success: false,
        message: 'VS Code is not installed',
        verified: false
      };
    }

    const script = `Start-Process -FilePath "${detection.path}" -ArgumentList '${target}'`;
    await runPowerShell(script, 8000);

    return {
      id: `vscode_file_${Date.now()}`,
      tool: 'open_vscode_file',
      success: true,
      message: `Opened file "${filePath}" in VS Code`,
      verified: true
    };
  }

  public static async focusVSCode(): Promise<ActionResult> {
    const script = `
      $proc = Get-Process -Name "Code" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
      if ($proc) {
        $wshell = New-Object -ComObject WScript.Shell
        $wshell.AppActivate($proc.Id)
        "focused"
      } else {
        "not_found"
      }
    `;

    const result = await runPowerShell(script, 4000);
    const success = result.stdout.includes('focused');

    return {
      id: `focus_vscode_${Date.now()}`,
      tool: 'focus_vscode',
      success,
      message: success ? 'VS Code focused successfully' : 'VS Code window not found',
      verified: success
    };
  }
}
