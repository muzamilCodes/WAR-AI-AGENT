import fs from 'fs';
import path from 'path';
import os from 'os';
import { ActionResult } from '@war-ai/shared';
import { runPowerShell } from '../utils/powershell';

export class ScreenController {
  public static async takeScreenshot(customPath?: string): Promise<ActionResult> {
    const startTime = Date.now();
    const tempDir = path.join(os.tmpdir(), 'war_ai_screenshots');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const filePath = customPath ? path.resolve(customPath) : path.join(tempDir, `screen_${Date.now()}.png`);

    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing

      $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      $bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
      $bitmap.Save("${filePath.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png)
      $graphics.Dispose()
      $bitmap.Dispose()
    `;

    await runPowerShell(script, 8000);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const base64Data = fs.readFileSync(filePath).toString('base64');

      return {
        id: `screenshot_${Date.now()}`,
        tool: 'take_screenshot',
        success: true,
        message: `Screenshot captured successfully (${stats.size} bytes)`,
        data: {
          filePath,
          base64: `data:image/png;base64,${base64Data}`,
          sizeBytes: stats.size
        },
        verified: true,
        executionTimeMs: Date.now() - startTime
      };
    } else {
      return {
        id: `screenshot_${Date.now()}`,
        tool: 'take_screenshot',
        success: false,
        message: 'Failed to capture screenshot',
        verified: false,
        executionTimeMs: Date.now() - startTime
      };
    }
  }

  public static async inspectScreen(): Promise<ActionResult> {
    const screenshotResult = await this.takeScreenshot();
    if (!screenshotResult.success) {
      return screenshotResult;
    }

    // Get active window title and resolution
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      $activeWindow = (Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -ne "" } | Select-Object -First 1 -ExpandProperty MainWindowTitle)
      "$($screen.Width)x$($screen.Height)|$activeWindow"
    `;

    const info = await runPowerShell(script, 3000);
    const [resolution, activeTitle] = (info.stdout || '1920x1080|N/A').split('|');

    return {
      id: `inspect_screen_${Date.now()}`,
      tool: 'inspect_screen',
      success: true,
      message: `Screen analyzed: ${resolution}, Active Window: "${activeTitle}"`,
      data: {
        resolution,
        activeWindow: activeTitle,
        screenshotBase64: screenshotResult.data?.base64
      },
      verified: true
    };
  }

  public static async findVisibleText(text: string): Promise<ActionResult> {
    const inspect = await this.inspectScreen();
    const hasMatch = inspect.data?.activeWindow?.toLowerCase().includes(text.toLowerCase());

    return {
      id: `find_text_${Date.now()}`,
      tool: 'find_visible_text',
      success: !!hasMatch,
      message: hasMatch ? `Found "${text}" in active window title: "${inspect.data?.activeWindow}"` : `Text "${text}" not found in current foreground window`,
      data: { query: text, activeWindow: inspect.data?.activeWindow },
      verified: true
    };
  }
}
