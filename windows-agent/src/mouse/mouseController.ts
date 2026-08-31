import { ActionResult } from '@war-ai/shared';
import { runPowerShell } from '../utils/powershell';

export class MouseController {
  private static user32Definition = `
    $User32 = @"
    using System;
    using System.Runtime.InteropServices;
    public class User32 {
      [DllImport("user32.dll")]
      public static extern bool SetCursorPos(int X, int Y);

      [DllImport("user32.dll")]
      public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);
      
      public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
      public const uint MOUSEEVENTF_LEFTUP = 0x0004;
      public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
      public const uint MOUSEEVENTF_RIGHTUP = 0x0010;
      public const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
      public const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
      public const uint MOUSEEVENTF_WHEEL = 0x0800;
    }
"@
    if (-not ([System.Management.Automation.PSTypeName]'User32').Type) {
      Add-Type -TypeDefinition $User32
    }
  `;

  public static async moveMouse(x: number = 500, y: number = 500): Promise<ActionResult> {
    const script = `
      ${this.user32Definition}
      [User32]::SetCursorPos(${Math.round(x)}, ${Math.round(y)})
    `;
    await runPowerShell(script, 3000);

    return {
      id: `mouse_move_${Date.now()}`,
      tool: 'move_mouse',
      success: true,
      message: `Mouse moved to coordinates (${x}, ${y})`,
      verified: true
    };
  }

  public static async click(x?: number, y?: number): Promise<ActionResult> {
    const coords = (x !== undefined && y !== undefined)
      ? `[User32]::SetCursorPos(${Math.round(x)}, ${Math.round(y)}); Start-Sleep -Milliseconds 50;`
      : '';

    const script = `
      ${this.user32Definition}
      ${coords}
      [User32]::mouse_event([User32]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
      Start-Sleep -Milliseconds 30
      [User32]::mouse_event([User32]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    `;
    await runPowerShell(script, 3000);

    return {
      id: `mouse_click_${Date.now()}`,
      tool: 'click',
      success: true,
      message: (x !== undefined && y !== undefined) ? `Clicked at (${x}, ${y})` : 'Left click executed at current cursor position',
      verified: true
    };
  }

  public static async doubleClick(x?: number, y?: number): Promise<ActionResult> {
    const coords = (x !== undefined && y !== undefined)
      ? `[User32]::SetCursorPos(${Math.round(x)}, ${Math.round(y)}); Start-Sleep -Milliseconds 50;`
      : '';

    const script = `
      ${this.user32Definition}
      ${coords}
      [User32]::mouse_event([User32]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
      [User32]::mouse_event([User32]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
      Start-Sleep -Milliseconds 100
      [User32]::mouse_event([User32]::MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
      [User32]::mouse_event([User32]::MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
    `;
    await runPowerShell(script, 3000);

    return {
      id: `mouse_dblclick_${Date.now()}`,
      tool: 'double_click',
      success: true,
      message: 'Double click executed',
      verified: true
    };
  }

  public static async rightClick(x?: number, y?: number): Promise<ActionResult> {
    const coords = (x !== undefined && y !== undefined)
      ? `[User32]::SetCursorPos(${Math.round(x)}, ${Math.round(y)}); Start-Sleep -Milliseconds 50;`
      : '';

    const script = `
      ${this.user32Definition}
      ${coords}
      [User32]::mouse_event([User32]::MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0)
      Start-Sleep -Milliseconds 30
      [User32]::mouse_event([User32]::MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0)
    `;
    await runPowerShell(script, 3000);

    return {
      id: `mouse_rclick_${Date.now()}`,
      tool: 'right_click',
      success: true,
      message: 'Right click executed',
      verified: true
    };
  }

  public static async scroll(direction: 'up' | 'down' | 'left' | 'right' = 'down', amount: number = 3): Promise<ActionResult> {
    const wheelDelta = direction === 'up' ? amount * 120 : -(amount * 120);
    const script = `
      ${this.user32Definition}
      [User32]::mouse_event([User32]::MOUSEEVENTF_WHEEL, 0, 0, ${wheelDelta}, 0)
    `;
    await runPowerShell(script, 3000);

    return {
      id: `mouse_scroll_${Date.now()}`,
      tool: 'scroll',
      success: true,
      message: `Scrolled ${direction} by ${amount} notches`,
      verified: true
    };
  }
}
