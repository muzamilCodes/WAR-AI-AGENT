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

    // 2. Direct Windows PC / Laptop Lock
    if (/(?:lock|लॉक)/i.test(lower) && /(?:laptop|pc|computer|system|screen|लैपटॉप|पीसी|कंप्यूटर|स्क्रीन|karo|kar do)/i.test(lower)) {
      return {
        primaryIntent: 'RUN_COMMAND',
        confidence: 0.98,
        entities: { command: 'lock_workstation' },
        suggestedTools: [{ tool: 'lock_workstation', args: {} }]
      };
    }

    // Direct Show Desktop / Minimize All
    if ((/(?:desktop|डेस्कटॉप)/i.test(lower) && /(?:show|par jao|dekho|kholo|जाओ|देखो)/i.test(lower)) || /(?:minimize all|sab minimize|सारे मिनिमाइज)/i.test(lower)) {
      return {
        primaryIntent: 'RUN_COMMAND',
        confidence: 0.95,
        entities: { command: 'minimize_all' },
        suggestedTools: [{ tool: 'system_control', args: { action: 'minimize_all' } }]
      };
    }

    // Volume Controls (Mute / Volume Up / Down)
    if (/(?:volume|sound|आवाज|साउंड)/i.test(lower) || /(?:mute|म्यूट)/i.test(lower)) {
      if (/(?:mute|silent|band|म्यूट|बंद)/i.test(lower)) {
        return {
          primaryIntent: 'KEYBOARD_MOUSE',
          confidence: 0.95,
          entities: {},
          suggestedTools: [{ tool: 'system_control', args: { action: 'mute' } }]
        };
      }
      if (/(?:badhao|up|increase|tez|बढ़ाओ|तेज)/i.test(lower)) {
        return {
          primaryIntent: 'KEYBOARD_MOUSE',
          confidence: 0.95,
          entities: {},
          suggestedTools: [{ tool: 'system_control', args: { action: 'volume_up' } }]
        };
      }
      if (/(?:kam|down|decrease|slow|कम|धीमा)/i.test(lower)) {
        return {
          primaryIntent: 'KEYBOARD_MOUSE',
          confidence: 0.95,
          entities: {},
          suggestedTools: [{ tool: 'system_control', args: { action: 'volume_down' } }]
        };
      }
    }

    // Recycle bin empty
    if (/(?:recycle bin|trash|रीसायकल बिन)/i.test(lower) && /(?:khali|empty|clean|saaf|खाली|साफ)/i.test(lower)) {
      return {
        primaryIntent: 'FILE_OPERATION',
        confidence: 0.95,
        entities: {},
        suggestedTools: [{ tool: 'system_control', args: { action: 'recycle_bin' } }]
      };
    }

    // Task Manager
    if (/(?:task manager|टास्क मैनेजर)/i.test(lower)) {
      return {
        primaryIntent: 'OPEN_APP',
        confidence: 0.95,
        entities: { appName: 'Task Manager' },
        suggestedTools: [{ tool: 'system_control', args: { action: 'task_manager' } }]
      };
    }

    // Windows Settings
    if (/(?:settings|windows settings|सेटिंग्स)/i.test(lower) && /(?:kholo|open|खोलो)/i.test(lower)) {
      return {
        primaryIntent: 'OPEN_APP',
        confidence: 0.95,
        entities: { appName: 'Settings' },
        suggestedTools: [{ tool: 'system_control', args: { action: 'settings' } }]
      };
    }

    // 3. YouTube & Web / Browser Search (Priority over terminal "chalao")
    if (lower.includes('youtube') || lower.includes('यूट्यूब')) {
      const searchMatch = raw.replace(/(?:youtube|यूट्यूब|kholo|open|par|pe|chalao|play|search|gana|song|dekho|video)/gi, '').trim();
      const url = searchMatch 
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchMatch)}`
        : 'https://youtube.com';
      return {
        primaryIntent: 'BROWSER_ACTION',
        confidence: 0.98,
        entities: { browserUrl: url, searchQuery: searchMatch },
        suggestedTools: [{ tool: 'open_browser', args: { url } }]
      };
    }

    if (lower.includes('google') || (lower.includes('search') && !lower.includes('search_folder'))) {
      const queryMatch = raw.replace(/(?:search|dhoondo|karo|google|par|pe|kholo|open|website)/gi, '').trim();
      if (queryMatch) {
        return {
          primaryIntent: 'BROWSER_ACTION',
          confidence: 0.95,
          entities: { searchQuery: queryMatch },
          suggestedTools: [{ tool: 'search_browser', args: { query: queryMatch } }]
        };
      }
      return {
        primaryIntent: 'BROWSER_ACTION',
        confidence: 0.95,
        entities: { browserUrl: 'https://google.com' },
        suggestedTools: [{ tool: 'open_browser', args: { url: 'https://google.com' } }]
      };
    }

    // 4. Screen inspection / screenshot
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

    // 5. File & Folder Operations (Create, Open, Delete)
    if (/(?:folder|फ़ोल्डर|डायरेक्टरी|directory)/i.test(lower)) {
      if (/(?:banao|create|make|new|नया|बनाओ)/i.test(lower)) {
        const folderNameMatch = raw.match(/(?:naam|name)\s+["']?([a-zA-Z0-9_-]+)["']?/i) || 
          raw.match(/(?:folder|directory)\s+["']?([a-zA-Z0-9_-]+)["']?/i) ||
          raw.match(/(?:banao|create)\s+["']?([a-zA-Z0-9_-]+)["']?/i);
        const folderName = (folderNameMatch && !['ek', 'banao', 'karo'].includes(folderNameMatch[1].toLowerCase())) 
          ? folderNameMatch[1].trim() 
          : 'NewFolder';
        const targetPath = `${process.env.USERPROFILE || 'C:\\Users\\Default'}\\Desktop\\${folderName}`;
        return {
          primaryIntent: 'FILE_OPERATION',
          confidence: 0.95,
          entities: { folderPath: targetPath },
          suggestedTools: [{ tool: 'create_folder', args: { path: targetPath } }]
        };
      }
      if (/(?:kholo|open|खोलो)/i.test(lower)) {
        const folderNameMatch = raw.match(/(?:folder|directory)\s+["']?([a-zA-Z0-9_\-\s]+)["']?/i);
        const folderName = folderNameMatch ? folderNameMatch[1].trim() : 'Desktop';
        return {
          primaryIntent: 'OPEN_FOLDER',
          confidence: 0.95,
          entities: { folderPath: folderName },
          suggestedTools: [{ tool: 'open_folder', args: { path: folderName } }]
        };
      }
    }

    if (/(?:file|फ़ाइल|फाइल|document|text file)/i.test(lower)) {
      if (/(?:banao|create|make|write|लिखो|बनाओ)/i.test(lower)) {
        const fileNameMatch = raw.match(/(?:naam|name)\s+["']?([a-zA-Z0-9_\-\.]+)["']?/i) || 
          raw.match(/(?:file)\s+["']?([a-zA-Z0-9_\-\.]+)["']?/i) ||
          raw.match(/(?:banao|create)\s+["']?([a-zA-Z0-9_\-\.]+)["']?/i);
        const fileName = (fileNameMatch && !['ek', 'banao', 'karo'].includes(fileNameMatch[1].toLowerCase())) 
          ? fileNameMatch[1].trim() 
          : 'note.txt';
        const targetPath = `${process.env.USERPROFILE || 'C:\\Users\\Default'}\\Desktop\\${fileName}`;
        return {
          primaryIntent: 'FILE_OPERATION',
          confidence: 0.95,
          entities: { filePath: targetPath },
          suggestedTools: [{ tool: 'create_file', args: { path: targetPath, content: `Created by WAR AI on ${new Date().toLocaleString()}` } }]
        };
      }
      if (/(?:delete|hatao|remove|डिलीट|हटाओ)/i.test(lower)) {
        const fileNameMatch = raw.match(/(?:file)\s+["']?([a-zA-Z0-9_\-\.]+)["']?/i);
        const fileName = fileNameMatch ? fileNameMatch[1].trim() : '';
        return {
          primaryIntent: 'FILE_OPERATION',
          confidence: 0.95,
          entities: { filePath: fileName },
          suggestedTools: [{ tool: 'delete_file', args: { path: fileName } }]
        };
      }
    }

    // 6. VS Code & Coding Projects (Priority detection)
    const hasVSCode = 
      /(?:v[s|d]?[-\s]?code|visual\s*studio\s*code|\bvsc\b|\bcode\b|vdscode|वीएस\s*कोड|विजुअल\s*स्टूडियो|कोड)/i.test(lower);

    const isProjectOpen = /(?:project|प्रोजेक्ट)/i.test(lower) || /(?:sportify|स्पोर्टिफाई)/i.test(lower);
    const hasProjectMatch = isProjectOpen ? (lower.match(/([a-zA-Z0-9_-]+)\s+(?:project|वाला|प्रोजेक्ट)/i) || 
      lower.match(/(?:project|वाला|प्रोजेक्ट)\s+([a-zA-Z0-9_-]+)/i)) : null;
    const projectName = hasProjectMatch ? hasProjectMatch[1] : (/(?:sportify|स्पोर्टिफाई)/i.test(lower) ? 'Sportify' : undefined);

    if (projectName || (hasVSCode && /(?:project|प्रोजेक्ट)/i.test(lower))) {
      const pName = projectName || (hasVSCode ? 'Sportify' : 'project');
      const wantsRun = /(?:run|start|chalao|चलाओ|रन)/i.test(lower);
      const wantsTerminal = /(?:terminal|टर्मिनल)/i.test(lower);

      const tools: Array<{ tool: ToolName; args: Record<string, any> }> = [
        { tool: 'project_discovery', args: { name: pName } },
        { tool: 'open_vscode_project', args: { path: pName } }
      ];

      if (wantsTerminal || wantsRun) {
        tools.push({ tool: 'open_terminal', args: {} });
        if (wantsRun) {
          tools.push({ tool: 'execute_command', args: { command: 'npm run dev', runInBackground: true } });
        }
      }

      return {
        primaryIntent: 'OPEN_PROJECT',
        confidence: 0.95,
        entities: {
          projectName: pName,
          appName: 'Visual Studio Code'
        },
        suggestedTools: tools
      };
    }

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

    // 6. All Known Windows Applications (Chrome, Spotify, Notepad, VLC, Calculator, etc.)
    const knownApps: Array<{ keywords: RegExp; exe: string }> = [
      { keywords: /(?:chrome|क्रोम|google chrome)/i, exe: 'chrome.exe' },
      { keywords: /(?:spotify|स्पॉटिफ़ाई|gana)/i, exe: 'spotify.exe' },
      { keywords: /(?:notepad|नोटपैड|text editor)/i, exe: 'notepad.exe' },
      { keywords: /(?:calculator|calc|कैलकुलेटर)/i, exe: 'calc.exe' },
      { keywords: /(?:explorer|file\s*manager|my\s*computer|फ़ाइल\s*मैनेजर)/i, exe: 'explorer.exe' },
      { keywords: /(?:vlc|video player)/i, exe: 'vlc.exe' },
      { keywords: /(?:edge|msedge|एज)/i, exe: 'msedge.exe' },
      { keywords: /(?:paint|mspaint|पेंट)/i, exe: 'mspaint.exe' },
      { keywords: /(?:word|msword)/i, exe: 'winword.exe' },
      { keywords: /(?:excel)/i, exe: 'excel.exe' },
      { keywords: /(?:powerpoint|ppt)/i, exe: 'powerpnt.exe' },
      { keywords: /(?:postman)/i, exe: 'postman.exe' },
      { keywords: /(?:telegram)/i, exe: 'telegram.exe' },
      { keywords: /(?:whatsapp)/i, exe: 'whatsapp.exe' },
      { keywords: /(?:slack|स्लैक)/i, exe: 'slack.exe' },
      { keywords: /(?:discord|डिस्कॉर्ड)/i, exe: 'discord.exe' }
    ];

    for (const app of knownApps) {
      if (app.keywords.test(lower)) {
        if (/(?:band|close|hatao|बंद)/i.test(lower)) {
          return {
            primaryIntent: 'OPEN_APP',
            confidence: 0.95,
            entities: { appName: app.exe },
            suggestedTools: [{ tool: 'close_application', args: { name: app.exe } }]
          };
        }
        return {
          primaryIntent: 'OPEN_APP',
          confidence: 0.95,
          entities: { appName: app.exe },
          suggestedTools: [{ tool: 'open_application', args: { name: app.exe } }]
        };
      }
    }

    // 7. File & Folder Operations (Create, Open, Delete)
    if (/(?:folder|फ़ोल्डर|डायरेक्टरी|directory)/i.test(lower)) {
      if (/(?:banao|create|make|new|नया|बनाओ)/i.test(lower)) {
        const folderNameMatch = raw.match(/(?:naam|name)\s+["']?([a-zA-Z0-9_\-\s]+)["']?/i) || raw.match(/(?:folder|directory)\s+["']?([a-zA-Z0-9_\-\s]+)["']?/i);
        const folderName = folderNameMatch ? folderNameMatch[1].trim() : 'NewFolder';
        const targetPath = `${process.env.USERPROFILE || 'C:\\Users\\Default'}\\Desktop\\${folderName}`;
        return {
          primaryIntent: 'FILE_OPERATION',
          confidence: 0.95,
          entities: { folderPath: targetPath },
          suggestedTools: [{ tool: 'create_folder', args: { path: targetPath } }]
        };
      }
      if (/(?:kholo|open|खोलो)/i.test(lower)) {
        const folderNameMatch = raw.match(/(?:folder|directory)\s+["']?([a-zA-Z0-9_\-\s]+)["']?/i);
        const folderName = folderNameMatch ? folderNameMatch[1].trim() : 'Desktop';
        return {
          primaryIntent: 'OPEN_FOLDER',
          confidence: 0.95,
          entities: { folderPath: folderName },
          suggestedTools: [{ tool: 'open_folder', args: { path: folderName } }]
        };
      }
    }

    if (/(?:file|फ़ाइल|फाइल|document|text file)/i.test(lower)) {
      if (/(?:banao|create|make|write|लिखो|बनाओ)/i.test(lower)) {
        const fileNameMatch = raw.match(/(?:naam|name)\s+["']?([a-zA-Z0-9_\-\.]+)["']?/i) || raw.match(/(?:file)\s+["']?([a-zA-Z0-9_\-\.]+)["']?/i);
        const fileName = fileNameMatch ? fileNameMatch[1].trim() : 'note.txt';
        const targetPath = `${process.env.USERPROFILE || 'C:\\Users\\Default'}\\Desktop\\${fileName}`;
        return {
          primaryIntent: 'FILE_OPERATION',
          confidence: 0.95,
          entities: { filePath: targetPath },
          suggestedTools: [{ tool: 'create_file', args: { path: targetPath, content: `Created by WAR AI on ${new Date().toLocaleString()}` } }]
        };
      }
      if (/(?:delete|hatao|remove|डिलीट|हटाओ)/i.test(lower)) {
        const fileNameMatch = raw.match(/(?:file)\s+["']?([a-zA-Z0-9_\-\.]+)["']?/i);
        const fileName = fileNameMatch ? fileNameMatch[1].trim() : '';
        return {
          primaryIntent: 'FILE_OPERATION',
          confidence: 0.95,
          entities: { filePath: fileName },
          suggestedTools: [{ tool: 'delete_file', args: { path: fileName } }]
        };
      }
    }

    // 8. Terminal Commands & Terminal Open
    if (/(?:terminal|टर्मिनल|कमांड\s*प्रॉम्प्ट|cmd|powershell)/i.test(lower) && /(?:kholo|open|chalao|khol\s*do|start|खोलो|ओपन|चलाओ)/i.test(lower)) {
      const cwd = contextTarget?.targetPath || undefined;
      return {
        primaryIntent: 'OPEN_TERMINAL',
        confidence: 0.95,
        entities: {
          folderPath: cwd,
          projectName: contextTarget?.targetName
        },
        suggestedTools: [{ tool: 'open_terminal', args: { cwd } }]
      };
    }

    if (/(?:npm\s+|yarn\s+|pnpm\s+|git\s+|python\s+|ipconfig|dir|cls|ping|curl)/i.test(lower) || (/(?:run karo|execute)/i.test(lower) && !hasVSCode)) {
      let command = '';
      if (lower.includes('npm run dev') || lower.includes('dev server')) command = 'npm run dev';
      else if (lower.includes('npm install') || lower.includes('npm i')) command = 'npm install';
      else if (lower.includes('npm start')) command = 'npm start';
      else if (lower.includes('npm test')) command = 'npm test';
      else if (lower.includes('git status')) command = 'git status';
      else if (lower.includes('ipconfig')) command = 'ipconfig';
      else {
        command = raw;
      }

      const cwd = contextTarget?.targetPath || undefined;

      return {
        primaryIntent: 'RUN_COMMAND',
        confidence: 0.95,
        entities: {
          command: command || raw,
          projectName: contextTarget?.targetName
        },
        suggestedTools: [
          { tool: 'execute_command', args: { command: command || raw, cwd, runInBackground: command.includes('dev') || command.includes('start') } }
        ]
      };
    }

    // 9. Keyboard Shortcuts & Typing
    if (lower.includes('enter press') || lower.includes('press enter') || lower.includes('enter dabao')) {
      return {
        primaryIntent: 'KEYBOARD_MOUSE',
        confidence: 0.95,
        entities: { key: 'enter' },
        suggestedTools: [{ tool: 'press_key', args: { key: 'enter' } }]
      };
    }

    if (lower.includes('copy') || lower.includes('ctrl+c') || lower.includes('ctrl c')) {
      return {
        primaryIntent: 'KEYBOARD_MOUSE',
        confidence: 0.95,
        entities: {},
        suggestedTools: [{ tool: 'hotkey', args: { keys: ['ctrl', 'c'] } }]
      };
    }

    if (lower.includes('paste') || lower.includes('ctrl+v') || lower.includes('ctrl v')) {
      return {
        primaryIntent: 'KEYBOARD_MOUSE',
        confidence: 0.95,
        entities: {},
        suggestedTools: [{ tool: 'hotkey', args: { keys: ['ctrl', 'v'] } }]
      };
    }

    if (lower.includes('select all') || lower.includes('ctrl+a') || lower.includes('ctrl a')) {
      return {
        primaryIntent: 'KEYBOARD_MOUSE',
        confidence: 0.95,
        entities: {},
        suggestedTools: [{ tool: 'hotkey', args: { keys: ['ctrl', 'a'] } }]
      };
    }

    if (lower.includes('ctrl+s') || lower.includes('save karo') || lower.includes('ctrl s')) {
      return {
        primaryIntent: 'KEYBOARD_MOUSE',
        confidence: 0.95,
        entities: {},
        suggestedTools: [{ tool: 'hotkey', args: { keys: ['ctrl', 's'] } }]
      };
    }

    // 10. Generic "kholo" / "open" fallback for any named application
    const genericOpenMatch = raw.match(/(?:open|kholo|chalao|khol do|start)\s+([a-zA-Z0-9_\-\.]+)/i) || raw.match(/([a-zA-Z0-9_\-\.]+)\s+(?:open|kholo|chalao|khol do|start)/i);
    if (genericOpenMatch && !['karo', 'kar', 'do', 'please', 'aap', 'mera', 'meri', 'kuch', 'yeh', 'woh'].includes(genericOpenMatch[1].toLowerCase())) {
      const targetApp = genericOpenMatch[1].trim();
      return {
        primaryIntent: 'OPEN_APP',
        confidence: 0.85,
        entities: { appName: targetApp },
        suggestedTools: [{ tool: 'open_application', args: { name: targetApp } }]
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
