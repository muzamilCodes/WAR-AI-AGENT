import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface PowerShellResult {
  stdout: string;
  stderr: string;
  code: number;
}

export async function runPowerShell(script: string, timeoutMs: number = 30000): Promise<PowerShellResult> {
  const base64Script = Buffer.from(script, 'utf16le').toString('base64');
  
  try {
    const { stdout, stderr } = await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-EncodedCommand',
        base64Script
      ],
      {
        timeout: timeoutMs,
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024 // 10MB
      }
    );

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      code: 0
    };
  } catch (error: any) {
    return {
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || error.message || 'PowerShell execution error',
      code: error.code || 1
    };
  }
}

export async function runPowerShellJson<T = any>(script: string, timeoutMs: number = 30000): Promise<T> {
  const result = await runPowerShell(`${script} | ConvertTo-Json -Depth 5 -Compress`, timeoutMs);
  if (result.code !== 0 && !result.stdout) {
    throw new Error(result.stderr || 'PowerShell command failed');
  }
  if (!result.stdout) {
    return null as unknown as T;
  }
  try {
    return JSON.parse(result.stdout) as T;
  } catch (err: any) {
    throw new Error(`Failed to parse PowerShell JSON output: ${result.stdout}`);
  }
}
