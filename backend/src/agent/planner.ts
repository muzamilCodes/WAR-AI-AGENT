import { TaskPlan, TaskStep, SupportedLanguage, ToolName } from '@war-ai/shared';
import { ParsedIntent } from './intentDetector';

export class TaskPlanner {
  public static createPlan(
    userPrompt: string,
    parsedIntent: ParsedIntent,
    lang: SupportedLanguage,
    contextProject?: { name: string; path: string }
  ): TaskPlan {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const steps: TaskStep[] = [];
    const lower = userPrompt.toLowerCase();

    // Check if it's a compound multi-step prompt
    // e.g. "VS Code kholo, Sportify project open karo, terminal kholo aur project run karo"
    const isCompound = (lower.includes(',') || lower.includes(' aur ') || lower.includes(' then ') || lower.includes(' and ')) &&
      (lower.includes('vs code') || lower.includes('vscode')) &&
      (lower.includes('project') || lower.includes('sportify')) &&
      (lower.includes('terminal') || lower.includes('run'));

    if (isCompound) {
      const projectName = parsedIntent.entities.projectName || 'Sportify';

      steps.push({
        id: `step_1_${Date.now()}`,
        title: 'Detect VS Code',
        description: 'Verifying VS Code installation and environment',
        tool: 'detect_vscode',
        args: {},
        status: 'pending'
      });

      steps.push({
        id: `step_2_${Date.now()}`,
        title: `Find ${projectName} Project`,
        description: `Searching workspace directories for "${projectName}"`,
        tool: 'project_discovery',
        args: { name: projectName },
        status: 'pending'
      });

      steps.push({
        id: `step_3_${Date.now()}`,
        title: `Open Project in VS Code`,
        description: `Launching VS Code workspace with "${projectName}"`,
        tool: 'open_vscode_project',
        args: { path: contextProject?.path || projectName },
        status: 'pending'
      });

      steps.push({
        id: `step_4_${Date.now()}`,
        title: 'Open Terminal',
        description: `Opening active terminal in ${projectName} directory`,
        tool: 'open_terminal',
        args: { cwd: contextProject?.path },
        status: 'pending'
      });

      steps.push({
        id: `step_5_${Date.now()}`,
        title: 'Run Project',
        description: 'Executing development start script (npm run dev)',
        tool: 'execute_command',
        args: { command: 'npm run dev', cwd: contextProject?.path, runInBackground: true },
        status: 'pending'
      });

      return {
        id: planId,
        userPrompt,
        detectedLanguage: lang,
        summary: `Multi-step execution: Open VS Code -> Load ${projectName} -> Launch Terminal -> Run Project`,
        steps,
        status: 'planning',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }

    // Single or standard suggested tools
    if (parsedIntent.suggestedTools.length > 0) {
      for (let i = 0; i < parsedIntent.suggestedTools.length; i++) {
        const item = parsedIntent.suggestedTools[i];
        steps.push({
          id: `step_${i + 1}_${Date.now()}`,
          title: this.getStepTitle(item.tool, item.args),
          description: this.getStepDescription(item.tool, item.args),
          tool: item.tool,
          args: item.args,
          status: 'pending'
        });
      }
    }

    return {
      id: planId,
      userPrompt,
      detectedLanguage: lang,
      summary: steps.length > 0 ? steps[0].title : 'Conversational response',
      steps,
      status: 'planning',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  private static getStepTitle(tool: ToolName, args: Record<string, any>): string {
    switch (tool) {
      case 'open_application': return `Open ${args.name || 'Application'}`;
      case 'close_application': return `Close ${args.name || 'Application'}`;
      case 'open_vscode': return 'Open Visual Studio Code';
      case 'open_vscode_project': return `Open VS Code Project: ${args.path || ''}`;
      case 'project_discovery': return `Discover Project "${args.name || ''}"`;
      case 'open_terminal': return 'Launch Windows Terminal';
      case 'execute_command': return `Execute: ${args.command || ''}`;
      case 'open_folder': return `Open Folder: ${args.path || ''}`;
      case 'open_browser': return `Open Browser: ${args.url || ''}`;
      case 'search_browser': return `Search Web: "${args.query || ''}"`;
      case 'take_screenshot': return 'Capture Screen';
      case 'inspect_screen': return 'Analyze Active Screen';
      case 'stop_process': return 'Stop Active Operation';
      case 'press_key': return `Press Key: ${args.key || ''}`;
      case 'hotkey': return `Execute Shortcut: ${(args.keys || []).join('+')}`;
      default: return `Execute ${tool}`;
    }
  }

  private static getStepDescription(tool: ToolName, args: Record<string, any>): string {
    switch (tool) {
      case 'open_application': return `Starting Windows application "${args.name}" and verifying process window`;
      case 'open_vscode': return 'Locating VS Code executable and starting IDE';
      case 'open_vscode_project': return `Loading project directory in VS Code`;
      case 'project_discovery': return `Scanning workspace directories for matching project`;
      case 'execute_command': return `Running command safely in PowerShell with output monitoring`;
      case 'open_terminal': return `Spawning terminal in target working directory`;
      default: return `Performing ${tool} on Windows host with verification`;
    }
  }
}
