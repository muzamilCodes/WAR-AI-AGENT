# WAR AI — Windows Automation Tool Reference

All tools return structured output:
```typescript
interface ActionResult<T = any> {
  id: string;
  tool: ToolName;
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  verified?: boolean;
  verificationDetails?: string;
  executionTimeMs?: number;
}
```

---

## 1. Application Tools
- `open_application(name: string, args?: string[])`
- `close_application(name: string, force?: boolean)`
- `restart_application(name: string)`
- `focus_application(name: string)`
- `list_running_applications()`
- `find_installed_application(name: string)`

---

## 2. VS Code Tools
- `detect_vscode()`
- `open_vscode(path?: string, newWindow?: boolean)`
- `open_vscode_project(path: string)`
- `open_vscode_file(path: string, line?: number)`
- `focus_vscode()`

---

## 3. Filesystem & Project Tools
- `project_discovery(name: string, searchLocations?: string[])`
- `open_folder(path: string)`
- `create_folder(path: string)`
- `rename_folder(source: string, newName: string)`
- `move_folder(source: string, destination: string)`
- `copy_folder(source: string, destination: string)`
- `list_folder_contents(path: string, depth?: number)`
- `open_file(path: string)`
- `read_file(path: string, maxLength?: number)`
- `create_file(path: string, content?: string)`
- `edit_file(path: string, changes: string, mode?: 'append'|'overwrite'|'replace')`
- `delete_file(path: string, permanent?: boolean)`

---

## 4. Terminal Tools
- `open_terminal(cwd?: string)`
- `execute_command(command: string, cwd?: string, timeoutMs?: number, runInBackground?: boolean)`
- `read_terminal_output()`
- `stop_process(pid?: number, name?: string)`

---

## 5. Browser Tools
- `open_browser(url?: string)`
- `navigate_browser(url: string)`
- `search_browser(query: string, engine?: 'google'|'bing'|'duckduckgo')`
- `close_browser()`

---

## 6. Keyboard & Mouse Tools
- `type_text(text: string)`
- `press_key(key: string)`
- `hotkey(keys: string[])`
- `move_mouse(x?: number, y?: number)`
- `click(x?: number, y?: number)`
- `double_click(x?: number, y?: number)`
- `right_click(x?: number, y?: number)`
- `scroll(direction: 'up'|'down'|'left'|'right', amount: number)`

---

## 7. Screen & Inspection Tools
- `take_screenshot(customPath?: string)`
- `inspect_screen()`
- `find_visible_text(text: string)`
