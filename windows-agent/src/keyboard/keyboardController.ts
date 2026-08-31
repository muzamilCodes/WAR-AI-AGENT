import { ActionResult } from '@war-ai/shared';
import { runPowerShell } from '../utils/powershell';

export class KeyboardController {
  private static escapeForSendKeys(text: string): string {
    return text
      .replace(/\{/g, '{{}')
      .replace(/\}/g, '{}}')
      .replace(/\+/g, '{+}')
      .replace(/\^/g, '{^}')
      .replace(/%/g, '{%}')
      .replace(/~/g, '{~}')
      .replace(/\(/g, '{(}')
      .replace(/\)/g, '{)}');
  }

  public static async typeText(text: string): Promise<ActionResult> {
    const escaped = this.escapeForSendKeys(text);
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("${escaped}")
    `;
    await runPowerShell(script, 4000);

    return {
      id: `type_${Date.now()}`,
      tool: 'type_text',
      success: true,
      message: `Typed text (${text.length} characters)`,
      verified: true
    };
  }

  public static async pressKey(key: string): Promise<ActionResult> {
    const keyMap: Record<string, string> = {
      enter: '{ENTER}',
      tab: '{TAB}',
      esc: '{ESC}',
      escape: '{ESC}',
      space: ' ',
      backspace: '{BKSP}',
      delete: '{DEL}',
      up: '{UP}',
      down: '{DOWN}',
      left: '{LEFT}',
      right: '{RIGHT}',
      home: '{HOME}',
      end: '{END}',
      f5: '{F5}',
      f11: '{F11}',
      f12: '{F12}'
    };

    const formatted = keyMap[key.toLowerCase()] || key;
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("${formatted}")
    `;
    await runPowerShell(script, 4000);

    return {
      id: `key_${Date.now()}`,
      tool: 'press_key',
      success: true,
      message: `Pressed key "${key}"`,
      verified: true
    };
  }

  public static async hotkey(keys: string[]): Promise<ActionResult> {
    // Convert array of keys like ['ctrl', 's'] or ['ctrl', 'shift', 'p']
    let prefix = '';
    let mainKey = '';

    for (const k of keys) {
      const kl = k.toLowerCase();
      if (kl === 'ctrl' || kl === 'control') prefix += '^';
      else if (kl === 'alt') prefix += '%';
      else if (kl === 'shift') prefix += '+';
      else if (kl === 'win' || kl === 'windows') prefix += '^{ESC}'; // Windows key
      else mainKey = k;
    }

    const command = `${prefix}${mainKey.length === 1 ? mainKey : `{${mainKey.toUpperCase()}}`}`;

    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait("${command}")
    `;
    await runPowerShell(script, 4000);

    return {
      id: `hotkey_${Date.now()}`,
      tool: 'hotkey',
      success: true,
      message: `Executed hotkey "${keys.join(' + ')}"`,
      verified: true
    };
  }
}
