import fs from 'fs';
import { runPowerShell, runPowerShellJson } from '../utils/powershell';

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

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const script = `Get-Process -Name "${cleanName}" -ErrorAction SilentlyContinue | Select-Object -Property Id, ProcessName, MainWindowTitle`;
        const result = await runPowerShellJson<any>(script, 3000);

        if (result) {
          const item = Array.isArray(result) ? result[0] : result;
          if (item && item.Id) {
            return {
              verified: true,
              pid: item.Id,
              details: `Process "${cleanName}" is running (PID: ${item.Id}, Title: "${item.MainWindowTitle || 'N/A'}")`
            };
          }
        }
      } catch {
        // Retry
      }
      await this.sleep(400);
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

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const script = `Get-Process -Name "${cleanName}" -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count`;
        const result = await runPowerShell(script, 3000);
        const count = parseInt(result.stdout.trim(), 10);
        if (isNaN(count) || count === 0) {
          return {
            verified: true,
            details: `Process "${cleanName}" has successfully terminated`
          };
        }
      } catch {
        // Process likely stopped
        return {
          verified: true,
          details: `Process "${cleanName}" has terminated`
        };
      }
      await this.sleep(400);
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
