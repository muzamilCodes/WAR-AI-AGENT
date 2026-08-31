import { ContextMemory } from '@war-ai/shared';

export class ContextMemoryManager {
  private memory: ContextMemory;

  constructor() {
    this.memory = {
      recentProjects: [],
      recentApplications: [],
      conversationHistory: [],
      lastActivityTime: Date.now()
    };
  }

  public getContext(): ContextMemory {
    return { ...this.memory };
  }

  public updateActiveProject(name: string, path: string, type?: string) {
    this.memory.currentProject = {
      name,
      path,
      type,
      lastOpened: Date.now()
    };
    this.memory.currentFolder = path;
    this.memory.currentTerminalDirectory = path;

    // Add to recent projects
    const existingIdx = this.memory.recentProjects.findIndex(p => p.path === path);
    if (existingIdx !== -1) {
      this.memory.recentProjects.splice(existingIdx, 1);
    }
    this.memory.recentProjects.unshift({ name, path });
    if (this.memory.recentProjects.length > 10) {
      this.memory.recentProjects.pop();
    }
    this.memory.lastActivityTime = Date.now();
  }

  public updateActiveApplication(appName: string) {
    this.memory.currentApplication = appName;
    const existingIdx = this.memory.recentApplications.indexOf(appName);
    if (existingIdx !== -1) {
      this.memory.recentApplications.splice(existingIdx, 1);
    }
    this.memory.recentApplications.unshift(appName);
    if (this.memory.recentApplications.length > 10) {
      this.memory.recentApplications.pop();
    }
    this.memory.lastActivityTime = Date.now();
  }

  public updateActiveTerminalDir(cwd: string) {
    this.memory.currentTerminalDirectory = cwd;
    this.memory.lastActivityTime = Date.now();
  }

  public addMessage(role: 'user' | 'assistant', content: string) {
    this.memory.conversationHistory.push({ role, content });
    if (this.memory.conversationHistory.length > 30) {
      this.memory.conversationHistory.shift();
    }
    this.memory.lastActivityTime = Date.now();
  }

  public resolveContextualTarget(text: string): {
    hasResolution: boolean;
    resolvedType?: 'project' | 'app' | 'folder' | 'file';
    targetName?: string;
    targetPath?: string;
  } {
    const lower = text.toLowerCase();

    // Check if user is referring to "iska", "isko", "it", "this project", "active project"
    const isPronoun = /\b(iska|isko|usko|iska wala|ye wala|this|it|its|active)\b/i.test(lower);

    if (isPronoun) {
      if (lower.includes('terminal') || lower.includes('run') || lower.includes('test') || lower.includes('build')) {
        if (this.memory.currentProject) {
          return {
            hasResolution: true,
            resolvedType: 'project',
            targetName: this.memory.currentProject.name,
            targetPath: this.memory.currentProject.path
          };
        }
      }

      if (this.memory.currentFolder) {
        return {
          hasResolution: true,
          resolvedType: 'folder',
          targetPath: this.memory.currentFolder
        };
      }

      if (this.memory.currentApplication) {
        return {
          hasResolution: true,
          resolvedType: 'app',
          targetName: this.memory.currentApplication
        };
      }
    }

    return { hasResolution: false };
  }

  public clear() {
    this.memory = {
      recentProjects: [],
      recentApplications: [],
      conversationHistory: [],
      lastActivityTime: Date.now()
    };
  }
}
