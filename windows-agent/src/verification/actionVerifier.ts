import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { runPowerShell, runPowerShellJson } from '../utils/powershell';

const execFileAsync = promisify(execFile);

export class ActionVerifier {
  public static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public static async verifyProcessRunning(
    processName: string,
    maxWaitMs: number = 5000
  ): Promise<{ verified: boolean; pid?: number; details: string }> {
    const startTime = Date.now();
    const cleanName = processName.replace(/\.exe$/i, '');
    const exeName = `${cleanName}.exe`;

    while (Date.now() - startTime < maxWaitMs) {
      try {
        // Fast Native Tasklist check (< 50ms)
        const { stdout } = await execFileAsync('tasklist.exe', ['/FI', `IMAGENAME eq ${exeName}`, '/FO', 'CSV', '/NH'], { timeout: 2000, windowsHide: true });
        if (stdout && stdout.toLowerCase().includes(cleanName.toLowerCase())) {
          const match = stdout.match(/"([^"]+)","(\d+)"/);
          const pid = match ? parseInt(match[2], 10) : undefined;
          return {
            verified: true,
            pid,
            details: `Process "${cleanName}" is active (PID: ${pid || 'running'})`
          };
        }
      } catch {
        // Fallback to PowerShell
      }

      try {
        const script = `Get-Process -Name "${cleanName}" -ErrorAction SilentlyContinue | Select-Object -First 1 -Property Id, ProcessName`;
        const result = await runPowerShellJson<any>(script, 2000);
        if (result && (result.Id || (Array.isArray(result) && result[0]?.Id))) {
          const item = Array.isArray(result) ? result[0] : result;
          return {
            verified: true,
            pid: item.Id,
            details: `Process "${cleanName}" is active (PID: ${item.Id})`
          };
        }
      } catch {}

      await this.sleep(300);
    }

    return {
      verified: false,
      details: `Process "${cleanName}" was not found running after ${maxWaitMs}ms`
    };
  }

  public static async verifyProcessTerminated(
    processName: string,
    maxWaitMs: number = 5000
  ): Promise<{ verified: boolean; details: string }> {
    const startTime = Date.now();
    const cleanName = processName.replace(/\.exe$/i, '');
    const exeName = `${cleanName}.exe`;

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const { stdout } = await execFileAsync('tasklist.exe', ['/FI', `IMAGENAME eq ${exeName}`, '/FO', 'CSV', '/NH'], { timeout: 2000, windowsHide: true });
        if (!stdout || !stdout.toLowerCase().includes(cleanName.toLowerCase())) {
          return {
            verified: true,
            details: `Process "${cleanName}" has successfully terminated`
          };
        }
      } catch {
        return {
          verified: true,
          details: `Process "${cleanName}" has terminated`
        };
      }
      await this.sleep(300);
    }

    return {
      verified: false,
      details: `Process "${cleanName}" is still active after ${maxWaitMs}ms`
    };
  }

  public static async verifyFileExists(filePath: string): Promise<{ verified: boolean; details: string; sizeBytes?: number }> {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          return {
            verified: true,
            details: `File exists at "${filePath}" (${stats.size} bytes)`,
            sizeBytes: stats.size
          };
        }
      }
      return {
        verified: false,
        details: `File does not exist at "${filePath}"`
      };
    } catch (err: any) {
      return {
        verified: false,
        details: `Error checking file: ${err.message}`
      };
    }
  }

  public static async verifyFolderExists(folderPath: string): Promise<{ verified: boolean; details: string; fileCount?: number }> {
    try {
      if (fs.existsSync(folderPath)) {
        const stats = fs.statSync(folderPath);
        if (stats.isDirectory()) {
          const files = fs.readdirSync(folderPath);
          return {
            verified: true,
            details: `Folder exists at "${folderPath}" containing ${files.length} items`,
            fileCount: files.length
          };
        }
      }
      return {
        verified: false,
        details: `Directory does not exist at "${folderPath}"`
      };
    } catch (err: any) {
      return {
        verified: false,
        details: `Error checking directory: ${err.message}`
      };
    }
  }

  public static async verifyPortListening(port: number, maxWaitMs: number = 8000): Promise<{ verified: boolean; details: string }> {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const script = `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -Property OwningProcess, LocalAddress, LocalPort`;
        const result = await runPowerShellJson<any>(script, 3000);
        if (result) {
          const item = Array.isArray(result) ? result[0] : result;
          if (item && item.LocalPort == port) {
            return {
              verified: true,
              details: `Port ${port} is active and listening (PID: ${item.OwningProcess})`
            };
          }
        }
      } catch {
        // Retry
      }
      await this.sleep(500);
    }

    return {
      verified: false,
      details: `Port ${port} is not listening after ${maxWaitMs}ms`
    };
  }
}
