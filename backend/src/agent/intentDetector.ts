import { ToolName } from '@war-ai/shared';

export interface ParsedIntent {
  primaryIntent:
    | 'OPEN_APP'
    | 'OPEN_PROJECT'
    | 'OPEN_VSCODE'
    | 'OPEN_TERMINAL'
    | 'RUN_COMMAND'
    | 'OPEN_FOLDER'
    | 'FILE_OPERATION'
    | 'BROWSER_ACTION'
    | 'SCREEN_ACTION'
    | 'KEYBOARD_MOUSE'
    | 'STOP_OPERATION'
    | 'CONVERSATION';
  confidence: number;
  entities: {
    appName?: string;
    projectName?: string;
    filePath?: string;
    folderPath?: string;
    command?: string;
    browserUrl?: string;
    searchQuery?: string;
    key?: string;
    textToType?: string;
    fileContent?: string;
  };
  suggestedTools: Array<{ tool: ToolName; args: Record<string, any> }>;
}

export class IntentDetector {
  public static parse(text: string, contextTarget?: { targetName?: string; targetPath?: string }): ParsedIntent {
    const raw = text.trim();
    const lower = raw.toLowerCase();

    // 1. Check Stop / Interruption
    if (/^(ruko|stop|bas|cancel|ruk jao|rok do|abort|रुको|बस|रोक दो|कैंसिल)$/i.test(lower) || 
        /(?:chup|shanti|band karo|ab ruko|बस करो|चुप)/i.test(lower)) {
      return {
        primaryIntent: 'STOP_OPERATION',
        confidence: 1.0,
        entities: {},
        suggestedTools: [{ tool: 'stop_process', args: {} }]
      };
    }

    // VS Code detection helper with typo-tolerance & Hindi Devanagari
    const hasVSCode = 
      /(?:v[s|d]?[-\s]?code|visual\s*studio\s*code|\bvsc\b|\bcode\b|vdscode|वीएस\s*कोड|विजुअल\s*स्टूडियो|कोड)/i.test(lower);

    // Project detection (e.g. Sportify, project name, etc.)
    const hasProjectMatch = lower.match(/(?:project|वाला|प्रोजेक्ट|folder)\s+([a-zA-Z0-9_-]+)/i) || 
      lower.match(/([a-zA-Z0-9_-]+)\s+(?:project|वाला|प्रोजेक्ट)/i);
    const projectName = hasProjectMatch ? hasProjectMatch[1] : (/(?:sportify|स्पोर्टिफाई)/i.test(lower) ? 'Sportify' : undefined);

    // 3. Screen inspection / screenshot
    if (/(?:screenshot|screen\s*capture|screen\s*par|स्क्रीनशॉट|स्क्रीन\s*पर)/i.test(lower)) {
      if (/(?:error|kya hai|inspect|dekho|check|क्या\s*है|देखो)/i.test(lower)) {
        return {
          primaryIntent: 'SCREEN_ACTION',
          confidence: 0.95,
          entities: {},
          suggestedTools: [{ tool: 'inspect_screen', args: {} }]
        };
      }
      return {
        primaryIntent: 'SCREEN_ACTION',
        confidence: 0.95,
        entities: {},
        suggestedTools: [{ tool: 'take_screenshot', args: {} }]
      };
    }

    // 4. Terminal Command Execution (e.g. "npm install chalao", "npm run dev", "git status", "isko run karo")
    if (/(?:run karo|chalao|चलाओ|रन\s*करो|npm|yarn|pnpm|git\s+|python\s+)/i.test(lower) && !hasVSCode) {
      let command = '';
      if (lower.includes('npm run dev') || lower.includes('dev')) command = 'npm run dev';
      else if (lower.includes('npm install') || lower.includes('npm i') || lower.includes('install')) command = 'npm install';
      else if (lower.includes('npm start') || lower.includes('start')) command = 'npm start';
      else if (lower.includes('npm test') || lower.includes('test')) command = 'npm test';
      else if (lower.includes('git status')) command = 'git status';
      else {
        command = 'npm run dev'; // standard sensible default for web projects
      }

      const cwd = contextTarget?.targetPath || undefined;

      return {
        primaryIntent: 'RUN_COMMAND',
        confidence: 0.9,
        entities: {
          command: command || raw,
          projectName: contextTarget?.targetName
        },
        suggestedTools: [
          { tool: 'execute_command', args: { command: command || raw, cwd, runInBackground: command.includes('dev') || command.includes('start') } }
        ]
      };
    }

    // 5. Open Terminal
    if (/(?:terminal|टर्मिनल|कमांड\s*प्रॉम्प्ट|cmd)/i.test(lower) && /(?:kholo|open|chalao|khol\s*do|start|खोलो|ओपन|चलाओ)/i.test(lower)) {
      const cwd = contextTarget?.targetPath || undefined;
      return {
        primaryIntent: 'OPEN_TERMINAL',
        confidence: 0.95,
        entities: {
          folderPath: cwd,
          projectName: contextTarget?.targetName
        },
        suggestedTools: [
          { tool: 'open_terminal', args: { cwd } }
        ]
      };
    }

    // 6. Project Open in VS Code (e.g. "Sportify project kholo", "VS Code mein sportify kholo")
    if (projectName || (hasVSCode && /(?:project|प्रोजेक्ट)/i.test(lower))) {
      const pName = projectName || (hasVSCode ? '' : 'project');
      return {
        primaryIntent: 'OPEN_PROJECT',
        confidence: 0.92,
        entities: {
          projectName: pName,
          appName: 'Visual Studio Code'
        },
        suggestedTools: pName ? [
          { tool: 'project_discovery', args: { name: pName } }
        ] : [
          { tool: 'open_vscode', args: {} }
        ]
      };
    }

    // 7. Direct VS Code Open / Focus / Close (e.g. "open myn vdscode", "VS code kholo", "वीएस कोड खोलो")
    if (hasVSCode) {
      if (/(?:band|close|hatao|बंद)/i.test(lower)) {
        return {
          primaryIntent: 'OPEN_APP',
          confidence: 0.95,
          entities: { appName: 'Code' },
          suggestedTools: [{ tool: 'close_application', args: { name: 'Code' } }]
        };
      }
      return {
        primaryIntent: 'OPEN_VSCODE',
        confidence: 0.95,
        entities: { appName: 'Code' },
        suggestedTools: [{ tool: 'open_vscode', args: {} }]
      };
    }

    // Other applications: Chrome, Notepad, Explorer, Calculator, Spotify, Edge
    const knownApps: Array<{ keywords: RegExp; exe: string }> = [
      { keywords: /(?:chrome|क्रोम)/i, exe: 'chrome.exe' },
      { keywords: /(?:notepad|नोटपैड)/i, exe: 'notepad.exe' },
      { keywords: /(?:calculator|calc|कैलकुलेटर)/i, exe: 'calc.exe' },
      { keywords: /(?:explorer|file\s*manager|फ़ाइल\s*मैनेजर)/i, exe: 'explorer.exe' },
      { keywords: /(?:spotify|स्पॉटिफ़ाई)/i, exe: 'spotify.exe' },
      { keywords: /(?:edge|msedge|एज)/i, exe: 'msedge.exe' },
      { keywords: /(?:slack|स्लैक)/i, exe: 'slack.exe' },
      { keywords: /(?:discord|डिस्कॉर्ड)/i, exe: 'discord.exe' }
    ];

    for (const app of knownApps) {
      if (app.keywords.test(lower)) {
        if (/(?:band|close|hatao|बंद)/i.test(lower)) {
          return {
            primaryIntent: 'OPEN_APP',
            confidence: 0.9,
            entities: { appName: app.exe },
            suggestedTools: [{ tool: 'close_application', args: { name: app.exe } }]
          };
        }
        return {
          primaryIntent: 'OPEN_APP',
          confidence: 0.9,
          entities: { appName: app.exe },
          suggestedTools: [{ tool: 'open_application', args: { name: app.exe } }]
        };
      }
    }

    // 8. Browser Search & Navigation
    if (lower.includes('google') || lower.includes('search') || lower.includes('youtube') || lower.includes('website')) {
      const isSearch = lower.includes('search') || lower.includes('dhoondo');
      const queryMatch = raw.replace(/(?:search|dhoondo|karo|google|par|pe|kholo|open)/gi, '').trim();

      if (isSearch && queryMatch) {
        return {
          primaryIntent: 'BROWSER_ACTION',
          confidence: 0.88,
          entities: { searchQuery: queryMatch },
          suggestedTools: [{ tool: 'search_browser', args: { query: queryMatch } }]
        };
      }

      const url = lower.includes('youtube') ? 'https://youtube.com' : 'https://google.com';
      return {
        primaryIntent: 'BROWSER_ACTION',
        confidence: 0.88,
        entities: { browserUrl: url },
        suggestedTools: [{ tool: 'open_browser', args: { url } }]
      };
    }

    // 9. Keyboard / Mouse commands
    if (lower.includes('enter press') || lower.includes('press enter') || lower.includes('dabao')) {
      return {
        primaryIntent: 'KEYBOARD_MOUSE',
        confidence: 0.9,
        entities: { key: 'enter' },
        suggestedTools: [{ tool: 'press_key', args: { key: 'enter' } }]
      };
    }

    if (lower.includes('ctrl+s') || lower.includes('save karo') || lower.includes('ctrl s')) {
      return {
        primaryIntent: 'KEYBOARD_MOUSE',
        confidence: 0.9,
        entities: {},
        suggestedTools: [{ tool: 'hotkey', args: { keys: ['ctrl', 's'] } }]
      };
    }

    // Default: Conversational chat
    return {
      primaryIntent: 'CONVERSATION',
      confidence: 0.5,
      entities: {},
      suggestedTools: []
    };
  }
}
