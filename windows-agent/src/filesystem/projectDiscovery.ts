import fs from 'fs';
import path from 'path';
import { ActionResult } from '@war-ai/shared';

export interface DiscoveredProject {
  name: string;
  path: string;
  type: string;
  lastModified: number;
}

export class ProjectDiscovery {
  private static getDefaultSearchRoots(): string[] {
    const userProfile = process.env.USERPROFILE || 'C:\\Users\\Default';
    const roots: string[] = [];

    // Desktop & OneDrive Desktop
    const desktop = path.join(userProfile, 'Desktop');
    if (fs.existsSync(desktop)) roots.push(desktop);
    
    const oneDrive = process.env.OneDrive || path.join(userProfile, 'OneDrive');
    if (fs.existsSync(oneDrive)) {
      const oneDriveDesktop = path.join(oneDrive, 'Desktop');
      if (fs.existsSync(oneDriveDesktop)) roots.push(oneDriveDesktop);
      const oneDriveDocs = path.join(oneDrive, 'Documents');
      if (fs.existsSync(oneDriveDocs)) roots.push(oneDriveDocs);
    }

    // Documents & Downloads
    const docs = path.join(userProfile, 'Documents');
    if (fs.existsSync(docs)) roots.push(docs);

    const downloads = path.join(userProfile, 'Downloads');
    if (fs.existsSync(downloads)) roots.push(downloads);

    // Common root dev folders
    const commonDevDirs = ['C:\\Projects', 'C:\\workspace', 'C:\\dev', 'D:\\Projects', 'D:\\workspace'];
    for (const d of commonDevDirs) {
      if (fs.existsSync(d)) roots.push(d);
    }

    return Array.from(new Set(roots));
  }

  private static isProjectDirectory(dirPath: string): { isProject: boolean; type: string } {
    try {
      if (fs.existsSync(path.join(dirPath, 'package.json'))) return { isProject: true, type: 'Node.js / Web' };
      if (fs.existsSync(path.join(dirPath, '.git'))) return { isProject: true, type: 'Git Repository' };
      if (fs.existsSync(path.join(dirPath, 'Cargo.toml'))) return { isProject: true, type: 'Rust' };
      if (fs.existsSync(path.join(dirPath, 'go.mod'))) return { isProject: true, type: 'Go' };
      if (fs.existsSync(path.join(dirPath, 'pom.xml')) || fs.existsSync(path.join(dirPath, 'build.gradle'))) return { isProject: true, type: 'Java' };
      if (fs.existsSync(path.join(dirPath, 'requirements.txt')) || fs.existsSync(path.join(dirPath, 'pyproject.toml'))) return { isProject: true, type: 'Python' };
      if (fs.existsSync(path.join(dirPath, 'CMakeLists.txt'))) return { isProject: true, type: 'C/C++' };
    } catch {
      // Access denied / skipped
    }
    return { isProject: false, type: 'Directory' };
  }

  public static async discoverProjects(
    query: string,
    customRoots: string[] = [],
    maxDepth: number = 3
  ): Promise<ActionResult<DiscoveredProject[]>> {
    const startTime = Date.now();
    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const searchRoots = [...new Set([...this.getDefaultSearchRoots(), ...customRoots])];
    const results: DiscoveredProject[] = [];

    const searchDir = (currentPath: string, currentDepth: number) => {
      if (currentDepth > maxDepth) return;
      try {
        const items = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const item of items) {
          if (!item.isDirectory()) continue;
          if (['node_modules', '.git', '.next', 'dist', 'build', '$Recycle.Bin', 'AppData'].includes(item.name)) continue;

          const itemPath = path.join(currentPath, item.name);
          const itemNameLower = item.name.toLowerCase().replace(/[^a-z0-9_-]/g, '');

          if (itemNameLower.includes(cleanQuery)) {
            const projectCheck = this.isProjectDirectory(itemPath);
            try {
              const stats = fs.statSync(itemPath);
              results.push({
                name: item.name,
                path: itemPath,
                type: projectCheck.type,
                lastModified: stats.mtimeMs
              });
            } catch {
              results.push({
                name: item.name,
                path: itemPath,
                type: projectCheck.type,
                lastModified: Date.now()
              });
            }
          }

          // Continue scanning subdirectories
          searchDir(itemPath, currentDepth + 1);
        }
      } catch {
        // Skip protected or unreadable folders
      }
    };

    for (const root of searchRoots) {
      searchDir(root, 1);
    }

    // Sort by exact name match and newest modification date
    results.sort((a, b) => {
      const aExact = a.name.toLowerCase() === query.toLowerCase();
      const bExact = b.name.toLowerCase() === query.toLowerCase();
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return b.lastModified - a.lastModified;
    });

    // Remove duplicates
    const unique = results.filter((item, idx, self) => self.findIndex(s => s.path === item.path) === idx);

    return {
      id: `discover_${Date.now()}`,
      tool: 'project_discovery',
      success: unique.length > 0,
      message: unique.length === 1
        ? `Found 1 project matching "${query}" at "${unique[0].path}"`
        : unique.length > 1
        ? `Found ${unique.length} projects matching "${query}"`
        : `No projects found matching "${query}" in standard workspace locations`,
      data: unique,
      verified: true,
      executionTimeMs: Date.now() - startTime
    };
  }
}
