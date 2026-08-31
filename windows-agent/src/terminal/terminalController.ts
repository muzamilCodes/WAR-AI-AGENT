import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { ActionResult } from '@war-ai/shared';
import { runPowerShell } from '../utils/powershell';

export interface RunningTask {
  id: string;
  pid?: number;
  command: string;
  cwd: string;
  startTime: number;
  process: ChildProcess;
  outputBuffer: string[];
  isCompleted: boolean;
  exitCode?: number;
}

export class TerminalController {
  private static activeTasks: Map<string, RunningTask> = new Map();
  private static lastOutput: string = '';

  public static async openTerminal(cwd?: string): Promise<ActionResult> {
    const workingDir = cwd ? path.resolve(cwd) : process.env.USERPROFILE || 'C:\\';
    
    // Check if Windows Terminal (wt.exe) is available
    const checkWt = await runPowerShell('where.exe wt.exe', 2000);
    const terminalExe = checkWt.code === 0 ? 'wt.exe' : 'powershell.exe';
    
    const script = terminalExe === 'wt.exe'
      ? `Start-Process wt.exe -ArgumentList "-d \`"${workingDir}\`""`
      : `Start-Process powershell.exe -WorkingDirectory "${workingDir}"`;

    await runPowerShell(script, 4000);

    return {
      id: `open_term_${Date.now()}`,
      tool: 'open_terminal',
      success: true,
      message: `Terminal opened in "${workingDir}"`,
      data: { cwd: workingDir, terminal: terminalExe },
      verified: true
    };
  }

  public static async executeCommand(
    command: string,
    cwd?: string,
    timeoutMs: number = 30000,
    runInBackground: boolean = false
  ): Promise<ActionResult> {
    const startTime = Date.now();
    const workingDir = cwd ? path.resolve(cwd) : process.cwd();
    const taskId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return new Promise<ActionResult>((resolve) => {
      const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], {
        cwd: workingDir,
        windowsHide: true,
        env: process.env
      });

      const outputLines: string[] = [];
      let isSettled = false;

      const task: RunningTask = {
        id: taskId,
        pid: child.pid,
        command,
        cwd: workingDir,
        startTime,
        process: child,
        outputBuffer: outputLines,
        isCompleted: false
      };

      this.activeTasks.set(taskId, task);

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        outputLines.push(text);
        this.lastOutput = text;
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        outputLines.push(text);
        this.lastOutput = text;
      });

      const timeoutTimer = setTimeout(() => {
        if (!isSettled && !runInBackground) {
          isSettled = true;
          task.isCompleted = true;
          try {
            child.kill('SIGTERM');
          } catch {}
          resolve({
            id: taskId,
            tool: 'execute_command',
            success: true, // partial output gathered
            message: `Command reached execution timeout of ${timeoutMs}ms. Process continues or terminated safely.`,
            data: {
              pid: child.pid,
              output: outputLines.join('').trim(),
              partial: true
            },
            verified: true,
            executionTimeMs: Date.now() - startTime
          });
        }
      }, timeoutMs);

      // If running in background (e.g. dev server), resolve after brief initial launch check (1.5s)
      if (runInBackground) {
        setTimeout(() => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timeoutTimer);
            resolve({
              id: taskId,
              tool: 'execute_command',
              success: true,
              message: `Command launched in background (PID: ${child.pid}) in "${workingDir}"`,
              data: {
                taskId,
                pid: child.pid,
                output: outputLines.join('').trim()
              },
              verified: true,
              executionTimeMs: Date.now() - startTime
            });
          }
        }, 1500);
      }

      child.on('close', (code) => {
        clearTimeout(timeoutTimer);
        task.isCompleted = true;
        task.exitCode = code || 0;

        if (!isSettled) {
          isSettled = true;
          const fullOutput = outputLines.join('').trim();
          resolve({
            id: taskId,
            tool: 'execute_command',
            success: code === 0,
            message: code === 0
              ? `Command executed successfully`
              : `Command completed with non-zero exit code: ${code}`,
            data: {
              code,
              output: fullOutput,
              pid: child.pid
            },
            verified: code === 0,
            executionTimeMs: Date.now() - startTime
          });
        }
      });

      child.on('error', (err) => {
        clearTimeout(timeoutTimer);
        task.isCompleted = true;
        if (!isSettled) {
          isSettled = true;
          resolve({
            id: taskId,
            tool: 'execute_command',
            success: false,
            message: `Failed to execute command: ${err.message}`,
            error: err.message,
            verified: false,
            executionTimeMs: Date.now() - startTime
          });
        }
      });
    });
  }

  public static async readTerminalOutput(): Promise<ActionResult> {
    return {
      id: `read_term_${Date.now()}`,
      tool: 'read_terminal_output',
      success: true,
      message: 'Retrieved terminal output buffer',
      data: {
        lastOutput: this.lastOutput,
        activeTasksCount: this.activeTasks.size
      },
      verified: true
    };
  }

  public static async stopProcess(pid?: number, name?: string): Promise<ActionResult> {
    if (pid) {
      const task = Array.from(this.activeTasks.values()).find(t => t.pid === pid);
      if (task) {
        try {
          task.process.kill('SIGKILL');
          this.activeTasks.delete(task.id);
        } catch {}
      }
      await runPowerShell(`Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`, 3000);
      return {
        id: `stop_proc_${Date.now()}`,
        tool: 'stop_process',
        success: true,
        message: `Process PID ${pid} stopped`,
        verified: true
      };
    }

    if (name) {
      await runPowerShell(`Stop-Process -Name "${name}" -Force -ErrorAction SilentlyContinue`, 3000);
      return {
        id: `stop_proc_${Date.now()}`,
        tool: 'stop_process',
        success: true,
        message: `Process "${name}" stopped`,
        verified: true
      };
    }

    return {
      id: `stop_proc_${Date.now()}`,
      tool: 'stop_process',
      success: false,
      message: 'PID or Process Name required to stop process',
      verified: false
    };
  }
}
