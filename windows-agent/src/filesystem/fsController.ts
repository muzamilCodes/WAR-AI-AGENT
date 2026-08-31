import fs from 'fs';
import path from 'path';
import { ActionResult } from '@war-ai/shared';
import { runPowerShell } from '../utils/powershell';
import { ActionVerifier } from '../verification/actionVerifier';

export class FSController {
  /**
   * Automatically resolves active OneDrive Desktop or Standard Desktop
   */
  public static getActiveDesktopPath(): string {
    const userProfile = process.env.USERPROFILE || 'C:\\Users\\Default';
    const oneDriveDesktop = path.join(userProfile, 'OneDrive', 'Desktop');
    if (fs.existsSync(oneDriveDesktop)) {
      return oneDriveDesktop;
    }
    return path.join(userProfile, 'Desktop');
  }

  /**
   * Resolves any folder name/alias (Desktop, Downloads, Documents, Custom name) to exact Windows path
   */
  public static resolveFolderPath(inputPath: string): string {
    const trimmed = inputPath.trim().replace(/^["']|["']$/g, '');
    const userProfile = process.env.USERPROFILE || 'C:\\Users\\Default';
    const activeDesktop = this.getActiveDesktopPath();

    if (!trimmed || trimmed.toLowerCase() === 'desktop' || trimmed.toLowerCase() === 'डेस्कटॉप') {
      return activeDesktop;
    }
    if (trimmed.toLowerCase() === 'downloads' || trimmed.toLowerCase() === 'डाउनलोड') {
      return path.join(userProfile, 'Downloads');
    }
    if (trimmed.toLowerCase() === 'documents' || trimmed.toLowerCase() === 'दस्तावेज़') {
      return path.join(userProfile, 'Documents');
    }

    // If absolute path
    if (path.isAbsolute(trimmed)) {
      return trimmed;
    }

    // Check if on active Desktop
    const onDesktop = path.join(activeDesktop, trimmed);
    if (fs.existsSync(onDesktop)) {
      return onDesktop;
    }

    // Check on standard Desktop
    const onStdDesktop = path.join(userProfile, 'Desktop', trimmed);
    if (fs.existsSync(onStdDesktop)) {
      return onStdDesktop;
    }

    // Check in user profile
    const onProfile = path.join(userProfile, trimmed);
    if (fs.existsSync(onProfile)) {
      return onProfile;
    }

    // Default to active Desktop location
    return onDesktop;
  }

  public static async openFolder(folderPath: string): Promise<ActionResult> {
    const resolved = this.resolveFolderPath(folderPath);
    
    // Ensure directory exists so explorer opens cleanly
    if (!fs.existsSync(resolved)) {
      try {
        fs.mkdirSync(resolved, { recursive: true });
      } catch {}
    }

    // Native PowerShell Invoke-Item brings folder immediately to front in File Explorer
    const script = `
      $target = "${resolved}"
      if (Test-Path $target) {
        Invoke-Item $target
      } else {
        Start-Process explorer.exe -ArgumentList $target
      }
    `;
    await runPowerShell(script, 4000);

    const folderName = path.basename(resolved) || 'Desktop';

    return {
      id: `open_dir_${Date.now()}`,
      tool: 'open_folder',
      success: true,
      message: `Opened "${folderName}" in Windows File Explorer`,
      data: { path: resolved, folderName },
      verified: true
    };
  }

  public static async createFolder(folderPath: string): Promise<ActionResult> {
    const resolved = this.resolveFolderPath(folderPath);
    try {
      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }

      // Also open folder in explorer to show user immediate visual confirmation
      const script = `Invoke-Item "${resolved}"`;
      await runPowerShell(script, 3000).catch(() => {});

      const folderName = path.basename(resolved);

      return {
        id: `create_dir_${Date.now()}`,
        tool: 'create_folder',
        success: true,
        message: `Successfully created folder "${folderName}" on Desktop`,
        data: { path: resolved, folderName },
        verified: true
      };
    } catch (err: any) {
      return {
        id: `create_dir_${Date.now()}`,
        tool: 'create_folder',
        success: false,
        message: `Failed to create folder: ${err.message}`,
        verified: false
      };
    }
  }

  public static async renameFolder(source: string, newName: string): Promise<ActionResult> {
    const resolvedSource = this.resolveFolderPath(source);
    const resolvedDest = path.join(path.dirname(resolvedSource), newName);

    try {
      fs.renameSync(resolvedSource, resolvedDest);
      const verify = await ActionVerifier.verifyFolderExists(resolvedDest);
      return {
        id: `rename_dir_${Date.now()}`,
        tool: 'rename_folder',
        success: verify.verified,
        message: `Renamed folder to "${resolvedDest}"`,
        verified: verify.verified
      };
    } catch (err: any) {
      return {
        id: `rename_dir_${Date.now()}`,
        tool: 'rename_folder',
        success: false,
        message: `Error renaming folder: ${err.message}`,
        verified: false
      };
    }
  }

  public static async moveFolder(source: string, destination: string): Promise<ActionResult> {
    const resolvedSource = this.resolveFolderPath(source);
    const resolvedDest = this.resolveFolderPath(destination);

    try {
      fs.renameSync(resolvedSource, resolvedDest);
      const verify = await ActionVerifier.verifyFolderExists(resolvedDest);
      return {
        id: `move_dir_${Date.now()}`,
        tool: 'move_folder',
        success: verify.verified,
        message: `Moved folder to "${resolvedDest}"`,
        verified: verify.verified
      };
    } catch (err: any) {
      return {
        id: `move_dir_${Date.now()}`,
        tool: 'move_folder',
        success: false,
        message: `Error moving folder: ${err.message}`,
        verified: false
      };
    }
  }

  public static async copyFolder(source: string, destination: string): Promise<ActionResult> {
    const resolvedSource = this.resolveFolderPath(source);
    const resolvedDest = this.resolveFolderPath(destination);

    try {
      fs.cpSync(resolvedSource, resolvedDest, { recursive: true });
      const verify = await ActionVerifier.verifyFolderExists(resolvedDest);
      return {
        id: `copy_dir_${Date.now()}`,
        tool: 'copy_folder',
        success: verify.verified,
        message: `Copied folder to "${resolvedDest}"`,
        verified: verify.verified
      };
    } catch (err: any) {
      return {
        id: `copy_dir_${Date.now()}`,
        tool: 'copy_folder',
        success: false,
        message: `Error copying folder: ${err.message}`,
        verified: false
      };
    }
  }

  public static async listFolderContents(folderPath: string, depth: number = 1): Promise<ActionResult> {
    const resolved = this.resolveFolderPath(folderPath);
    if (!fs.existsSync(resolved)) {
      return {
        id: `list_dir_${Date.now()}`,
        tool: 'list_folder_contents',
        success: false,
        message: `Directory does not exist: "${resolved}"`,
        verified: false
      };
    }

    try {
      const items = fs.readdirSync(resolved, { withFileTypes: true });
      const mapped = items.map(i => ({
        name: i.name,
        isDirectory: i.isDirectory(),
        path: path.join(resolved, i.name)
      }));

      return {
        id: `list_dir_${Date.now()}`,
        tool: 'list_folder_contents',
        success: true,
        message: `Found ${mapped.length} items in "${resolved}"`,
        data: mapped,
        verified: true
      };
    } catch (err: any) {
      return {
        id: `list_dir_${Date.now()}`,
        tool: 'list_folder_contents',
        success: false,
        message: `Error listing folder contents: ${err.message}`,
        verified: false
      };
    }
  }

  public static async openFile(filePath: string): Promise<ActionResult> {
    const resolved = this.resolveFolderPath(filePath);
    if (!fs.existsSync(resolved)) {
      return {
        id: `open_file_${Date.now()}`,
        tool: 'open_file',
        success: false,
        message: `File does not exist at "${resolved}"`,
        verified: false
      };
    }

    const script = `Start-Process -FilePath "${resolved}"`;
    await runPowerShell(script, 4000);

    return {
      id: `open_file_${Date.now()}`,
      tool: 'open_file',
      success: true,
      message: `Opened file "${path.basename(resolved)}" with default application`,
      verified: true
    };
  }

  public static async readFile(filePath: string, maxLength: number = 20000): Promise<ActionResult> {
    const resolved = this.resolveFolderPath(filePath);
    if (!fs.existsSync(resolved)) {
      return {
        id: `read_file_${Date.now()}`,
        tool: 'read_file',
        success: false,
        message: `File does not exist at "${resolved}"`,
        verified: false
      };
    }

    try {
      let content = fs.readFileSync(resolved, 'utf-8');
      const truncated = content.length > maxLength;
      if (truncated) {
        content = content.substring(0, maxLength) + '\n... [TRUNCATED]';
      }

      return {
        id: `read_file_${Date.now()}`,
        tool: 'read_file',
        success: true,
        message: `Read ${content.length} characters from "${resolved}"`,
        data: { content, truncated, totalLength: fs.statSync(resolved).size },
        verified: true
      };
    } catch (err: any) {
      return {
        id: `read_file_${Date.now()}`,
        tool: 'read_file',
        success: false,
        message: `Error reading file: ${err.message}`,
        verified: false
      };
    }
  }

  public static async createFile(filePath: string, content: string = ''): Promise<ActionResult> {
    const resolved = this.resolveFolderPath(filePath);
    try {
      const parentDir = path.dirname(resolved);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(resolved, content, 'utf-8');

      // Open file in default editor (e.g. Notepad)
      const script = `Invoke-Item "${resolved}"`;
      await runPowerShell(script, 3000).catch(() => {});

      return {
        id: `create_file_${Date.now()}`,
        tool: 'create_file',
        success: true,
        message: `Successfully created file "${path.basename(resolved)}" on Desktop`,
        data: { path: resolved },
        verified: true
      };
    } catch (err: any) {
      return {
        id: `create_file_${Date.now()}`,
        tool: 'create_file',
        success: false,
        message: `Error creating file: ${err.message}`,
        verified: false
      };
    }
  }

  public static async editFile(filePath: string, changes: string, mode: 'append' | 'overwrite' | 'replace' = 'overwrite'): Promise<ActionResult> {
    const resolved = this.resolveFolderPath(filePath);
    if (!fs.existsSync(resolved) && mode !== 'overwrite') {
      return {
        id: `edit_file_${Date.now()}`,
        tool: 'edit_file',
        success: false,
        message: `File "${resolved}" does not exist to edit`,
        verified: false
      };
    }

    try {
      if (mode === 'append') {
        fs.appendFileSync(resolved, '\n' + changes, 'utf-8');
      } else {
        fs.writeFileSync(resolved, changes, 'utf-8');
      }

      return {
        id: `edit_file_${Date.now()}`,
        tool: 'edit_file',
        success: true,
        message: `Successfully updated file "${path.basename(resolved)}"`,
        verified: true
      };
    } catch (err: any) {
      return {
        id: `edit_file_${Date.now()}`,
        tool: 'edit_file',
        success: false,
        message: `Error editing file: ${err.message}`,
        verified: false
      };
    }
  }

  public static async deleteFile(filePath: string, permanent: boolean = false): Promise<ActionResult> {
    const resolved = this.resolveFolderPath(filePath);
    if (!fs.existsSync(resolved)) {
      return {
        id: `delete_file_${Date.now()}`,
        tool: 'delete_file',
        success: true,
        message: `File was already absent: "${resolved}"`,
        verified: true
      };
    }

    try {
      fs.unlinkSync(resolved);
      return {
        id: `delete_file_${Date.now()}`,
        tool: 'delete_file',
        success: true,
        message: `Deleted file "${path.basename(resolved)}"`,
        verified: true
      };
    } catch (err: any) {
      return {
        id: `delete_file_${Date.now()}`,
        tool: 'delete_file',
        success: false,
        message: `Error deleting file: ${err.message}`,
        verified: false
      };
    }
  }

  public static async searchFiles(rootPath: string, pattern: string): Promise<ActionResult> {
    const resolvedRoot = this.resolveFolderPath(rootPath);
    if (!fs.existsSync(resolvedRoot)) {
      return {
        id: `search_file_${Date.now()}`,
        tool: 'search_file',
        success: false,
        message: `Search root directory does not exist: "${resolvedRoot}"`,
        verified: false
      };
    }

    try {
      const results: string[] = [];
      const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');

      const traverse = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (regex.test(entry.name)) {
            results.push(full);
          }
          if (entry.isDirectory() && results.length < 50) {
            try { traverse(full); } catch {}
          }
        }
      };

      traverse(resolvedRoot);

      return {
        id: `search_file_${Date.now()}`,
        tool: 'search_file',
        success: true,
        message: `Found ${results.length} matching files for "${pattern}"`,
        data: results,
        verified: true
      };
    } catch (err: any) {
      return {
        id: `search_file_${Date.now()}`,
        tool: 'search_file',
        success: false,
        message: `Error searching files: ${err.message}`,
        verified: false
      };
    }
  }
}
