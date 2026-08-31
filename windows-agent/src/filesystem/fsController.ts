import fs from 'fs';
import path from 'path';
import { ActionResult } from '@war-ai/shared';
import { runPowerShell } from '../utils/powershell';
import { ActionVerifier } from '../verification/actionVerifier';

export class FSController {
  public static async openFolder(folderPath: string): Promise<ActionResult> {
    const resolved = path.resolve(folderPath);
    if (!fs.existsSync(resolved)) {
      return {
        id: `open_dir_${Date.now()}`,
        tool: 'open_folder',
        success: false,
        message: `Folder does not exist at "${resolved}"`,
        verified: false
      };
    }

    const script = `Start-Process explorer.exe -ArgumentList "${resolved}"`;
    await runPowerShell(script, 4000);

    return {
      id: `open_dir_${Date.now()}`,
      tool: 'open_folder',
      success: true,
      message: `Opened folder "${resolved}" in Windows Explorer`,
      verified: true
    };
  }

  public static async createFolder(folderPath: string): Promise<ActionResult> {
    const resolved = path.resolve(folderPath);
    try {
      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }
      const verify = await ActionVerifier.verifyFolderExists(resolved);
      return {
        id: `create_dir_${Date.now()}`,
        tool: 'create_folder',
        success: verify.verified,
        message: verify.verified ? `Created folder at "${resolved}"` : 'Failed to verify folder creation',
        verified: verify.verified,
        verificationDetails: verify.details
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
    const resolvedSource = path.resolve(source);
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
    const resolvedSource = path.resolve(source);
    const resolvedDest = path.resolve(destination);

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
    const resolvedSource = path.resolve(source);
    const resolvedDest = path.resolve(destination);

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
    const resolved = path.resolve(folderPath);
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
    const resolved = path.resolve(filePath);
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
      message: `Opened file "${resolved}" with default system application`,
      verified: true
    };
  }

  public static async readFile(filePath: string, maxLength: number = 20000): Promise<ActionResult> {
    const resolved = path.resolve(filePath);
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
    const resolved = path.resolve(filePath);
    try {
      const parentDir = path.dirname(resolved);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(resolved, content, 'utf-8');

      const verify = await ActionVerifier.verifyFileExists(resolved);
      return {
        id: `create_file_${Date.now()}`,
        tool: 'create_file',
        success: verify.verified,
        message: verify.verified ? `Successfully created file at "${resolved}"` : 'Failed to verify file creation',
        verified: verify.verified,
        verificationDetails: verify.details
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
    const resolved = path.resolve(filePath);
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

      const verify = await ActionVerifier.verifyFileExists(resolved);
      return {
        id: `edit_file_${Date.now()}`,
        tool: 'edit_file',
        success: verify.verified,
        message: `Successfully updated file "${resolved}"`,
        verified: verify.verified
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
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      return {
        id: `delete_file_${Date.now()}`,
        tool: 'delete_file',
        success: false,
        message: `File does not exist: "${resolved}"`,
        verified: false
      };
    }

    try {
      fs.unlinkSync(resolved);
      const exists = fs.existsSync(resolved);
      return {
        id: `delete_file_${Date.now()}`,
        tool: 'delete_file',
        success: !exists,
        message: !exists ? `File deleted successfully from "${resolved}"` : 'Failed to delete file',
        verified: !exists
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
}
