import { exec } from 'child_process';
import { promisify } from 'util';
import { ActionResult } from '@war-ai/shared';

const execAsync = promisify(exec);

export class SystemController {
  /**
   * Lock Windows Workstation immediately
   */
  public static async lockWorkstation(): Promise<ActionResult> {
    try {
      await execAsync('rundll32.exe user32.dll,LockWorkStation');
      return {
        id: `lock_${Date.now()}`,
        tool: 'lock_workstation',
        success: true,
        message: 'Windows Workstation / Laptop locked successfully',
        verified: true
      };
    } catch (err: any) {
      return {
        id: `lock_${Date.now()}`,
        tool: 'lock_workstation',
        success: false,
        message: `Failed to lock Windows: ${err.message}`,
        error: err.message
      };
    }
  }

  /**
   * Minimize all windows (Show Desktop)
   */
  public static async minimizeAll(): Promise<ActionResult> {
    try {
      await execAsync('powershell -NoProfile -Command "(New-Object -ComObject Shell.Application).MinimizeAll()"');
      return {
        id: `sys_${Date.now()}`,
        tool: 'system_control',
        success: true,
        message: 'All windows minimized, Desktop focused',
        verified: true
      };
    } catch (err: any) {
      return {
        id: `sys_${Date.now()}`,
        tool: 'system_control',
        success: false,
        message: `Failed to minimize windows: ${err.message}`,
        error: err.message
      };
    }
  }

  /**
   * System Volume Controls
   */
  public static async controlVolume(action: 'up' | 'down' | 'mute'): Promise<ActionResult> {
    try {
      let charCode = 173; // mute
      if (action === 'up') charCode = 175;
      if (action === 'down') charCode = 174;

      await execAsync(`powershell -NoProfile -Command "(New-Object -ComObject Wscript.Shell).SendKeys([char]${charCode})"`);
      return {
        id: `vol_${Date.now()}`,
        tool: 'system_control',
        success: true,
        message: `System volume ${action} adjusted successfully`,
        verified: true
      };
    } catch (err: any) {
      return {
        id: `vol_${Date.now()}`,
        tool: 'system_control',
        success: false,
        message: `Failed to adjust volume: ${err.message}`,
        error: err.message
      };
    }
  }

  /**
   * Open Windows Settings or Task Manager
   */
  public static async openSystemUtility(utility: 'settings' | 'task_manager' | 'recycle_bin'): Promise<ActionResult> {
    try {
      if (utility === 'settings') {
        await execAsync('start ms-settings:');
      } else if (utility === 'task_manager') {
        await execAsync('start taskmgr.exe');
      } else if (utility === 'recycle_bin') {
        await execAsync('powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"');
      }

      return {
        id: `util_${Date.now()}`,
        tool: 'system_control',
        success: true,
        message: `System utility "${utility}" executed successfully`,
        verified: true
      };
    } catch (err: any) {
      return {
        id: `util_${Date.now()}`,
        tool: 'system_control',
        success: false,
        message: `Failed to open utility: ${err.message}`,
        error: err.message
      };
    }
  }
}
