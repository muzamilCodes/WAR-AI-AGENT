import { ActionResult } from '@war-ai/shared';
import { runPowerShell } from '../utils/powershell';
import { ActionVerifier } from '../verification/actionVerifier';

export class BrowserController {
  public static async openBrowser(url: string = 'https://www.google.com'): Promise<ActionResult> {
    const startTime = Date.now();
    const cleanUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

    const script = `Start-Process "${cleanUrl}"`;
    await runPowerShell(script, 4000);

    return {
      id: `open_browser_${Date.now()}`,
      tool: 'open_browser',
      success: true,
      message: `Browser opened with URL "${cleanUrl}"`,
      data: { url: cleanUrl },
      verified: true,
      executionTimeMs: Date.now() - startTime
    };
  }

  public static async navigateBrowser(url: string): Promise<ActionResult> {
    return await this.openBrowser(url);
  }

  public static async searchBrowser(query: string, engine: 'google' | 'bing' | 'duckduckgo' = 'google'): Promise<ActionResult> {
    const encoded = encodeURIComponent(query);
    let searchUrl = `https://www.google.com/search?q=${encoded}`;
    if (engine === 'bing') searchUrl = `https://www.bing.com/search?q=${encoded}`;
    if (engine === 'duckduckgo') searchUrl = `https://duckduckgo.com/?q=${encoded}`;

    return await this.openBrowser(searchUrl);
  }

  public static async closeBrowser(): Promise<ActionResult> {
    // Closes standard browsers
    const browsers = ['chrome', 'msedge', 'firefox', 'brave'];
    let closedAny = false;

    for (const b of browsers) {
      const check = await ActionVerifier.verifyProcessRunning(b, 200);
      if (check.verified) {
        await runPowerShell(`Stop-Process -Name "${b}" -ErrorAction SilentlyContinue`, 3000);
        closedAny = true;
      }
    }

    return {
      id: `close_browser_${Date.now()}`,
      tool: 'close_browser',
      success: true,
      message: closedAny ? 'Closed active browser instances' : 'No active browser process was found',
      verified: true
    };
  }
}
