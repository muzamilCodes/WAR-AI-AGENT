import { ActionRequest, ActionResult, ActivityEvent, ChatMessage, SupportedLanguage, TaskPlan, TaskStep } from '@war-ai/shared';
import { MultilingualEngine } from './multilingual';
import { IntentDetector } from './intentDetector';
import { ContextMemoryManager } from './contextMemory';
import { TaskPlanner } from './planner';
import { PermissionManager } from '../services/permissionManager';
import { DeviceManager } from '../services/deviceManager';
import { AuditLogger } from '../services/auditLogger';
import { LLMService } from '../services/llmService';

export interface BrainProcessResult {
  message: ChatMessage;
  plan?: TaskPlan;
  requiresConfirmation?: boolean;
  pendingAction?: ActionRequest;
}

export class AgentBrain {
  private static instance: AgentBrain;
  private memory: ContextMemoryManager;
  private permissionManager: PermissionManager;
  private deviceManager: DeviceManager;
  private activePlans: Map<string, TaskPlan> = new Map();
  private eventListeners: Array<(event: ActivityEvent) => void> = [];

  private constructor() {
    this.memory = new ContextMemoryManager();
    this.permissionManager = new PermissionManager();
    this.deviceManager = DeviceManager.getInstance();
  }

  public static getInstance(): AgentBrain {
    if (!AgentBrain.instance) {
      AgentBrain.instance = new AgentBrain();
    }
    return AgentBrain.instance;
  }

  public onActivity(listener: (event: ActivityEvent) => void) {
    this.eventListeners.push(listener);
  }

  private emitEvent(event: ActivityEvent) {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[AgentBrain] Error emitting activity event:', err);
      }
    }
  }

  public getContext() {
    return this.memory.getContext();
  }

  public async processUserMessage(
    userText: string,
    isVoice: boolean = false,
    forcedLang?: SupportedLanguage
  ): Promise<BrainProcessResult> {
    const timestamp = Date.now();
    const language = forcedLang || MultilingualEngine.detectLanguage(userText);
    this.memory.addMessage('user', userText);

    // 1. Check for Stop / Interruption
    if (MultilingualEngine.isInterruptionCommand(userText)) {
      const stoppedText = MultilingualEngine.generateNaturalResponse('stopped', language);
      return {
        message: {
          id: `msg_${timestamp}`,
          sender: 'agent',
          text: stoppedText,
          timestamp,
          language,
          isVoice
        }
      };
    }

    // 2. Resolve Context & Pronoun ("iska", "isko", "usko")
    const contextResolution = this.memory.resolveContextualTarget(userText);

    // 3. Intent Detection & Parsing
    const parsedIntent = IntentDetector.parse(userText, {
      targetName: contextResolution.targetName,
      targetPath: contextResolution.targetPath
    });

    // 4. Create Multi-Step Plan
    const plan = TaskPlanner.createPlan(
      userText,
      parsedIntent,
      language,
      this.memory.getContext().currentProject
    );

    this.activePlans.set(plan.id, plan);
    this.emitEvent({
      type: 'plan_created',
      planId: plan.id,
      title: plan.summary,
      description: `Task planned with ${plan.steps.length} steps`,
      status: 'planning',
      timestamp: Date.now()
    });

    // If conversational only
    if (plan.steps.length === 0) {
      let replyText = '';

      // 1. Try Google Gemini LLM reasoning if configured
      if (LLMService.isLLMConfigured()) {
        try {
          const llmReply = await LLMService.generateConversationalResponse(userText, language);
          if (llmReply) {
            replyText = llmReply;
          }
        } catch (err) {
          console.warn('[AgentBrain] LLM query fallback to local engine:', err);
        }
      }

      // 2. Local Fallback Engine if LLM did not provide response
      if (!replyText) {
        if (parsedIntent.primaryIntent === 'CONVERSATION') {
          const desi = ['hindi', 'urdu', 'roman_hindi', 'roman_urdu', 'hinglish'].includes(language);
          const lower = userText.toLowerCase();

          if (/(?:hello|hi|hey|namaste|salam|हैलो|नमस्ते|सलाम)/i.test(lower)) {
            replyText = desi
              ? `Namaste boss! Main WAR AI aapki personal AI assistant hoon. Boliye, aapke PC par aaj kya open ya run karna hai? (e.g. "VS Code kholo", "Spotify run karo")`
              : `Hello! I am WAR AI, your personal Windows PC assistant. What would you like to open or run today?`;
          } else if (/(?:ready|taiyaar|haan|theek hai|shuru|रेडी|तैयार|हाँ|ठीक)/i.test(lower)) {
            replyText = desi
              ? `Bilkul ready boss! Batayein kaun sa app, project ya command execute karun?`
              : `All set and ready! What task would you like to execute?`;
          } else if (/(?:kya kar|help|madad|features|commands|क्या कर|मदद)/i.test(lower)) {
            replyText = desi
              ? `Main aapke PC par VS Code khol sakti hoon, projects load kar sakti hoon, terminal run kar sakti hoon, browser search aur screen inspect kar sakti hoon.`
              : `I can launch VS Code, load and run your code projects, execute terminal commands, open browsers, and automate your Windows PC.`;
          } else {
            replyText = desi
              ? `Ji boss! Batayein kya karna hai? (Jaise: "VS Code kholo", "Spotify run karo", "Chrome kholo")`
              : `I'm listening! How can I help control your PC?`;
          }
        } else {
          replyText = MultilingualEngine.generateNaturalResponse('clarify', language);
        }
      }

      this.memory.addMessage('assistant', replyText);

      return {
        message: {
          id: `msg_${timestamp}`,
          sender: 'agent',
          text: replyText,
          timestamp,
          language,
          isVoice
        },
        plan
      };
    }

    // 5. Execute Steps sequentially
    let lastResult: ActionResult | undefined;
    let finalSpeech = '';

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      if (!step.tool) continue;

      // Handle dynamic context from previous step (e.g. project discovery path passed to VS Code or terminal)
      if (step.tool === 'open_vscode_project' || step.tool === 'open_terminal' || step.tool === 'execute_command') {
        if (!step.args?.path && !step.args?.cwd && this.memory.getContext().currentProject?.path) {
          if (step.tool === 'open_vscode_project') step.args = { ...step.args, path: this.memory.getContext().currentProject!.path };
          if (step.tool === 'open_terminal' || step.tool === 'execute_command') step.args = { ...step.args, cwd: this.memory.getContext().currentProject!.path };
        }
      }

      // Security & Permission evaluation
      const actionReq = this.permissionManager.evaluateAction(step.tool, step.args || {}, step.description);

      if (actionReq.requiresConfirmation) {
        step.status = 'waiting_confirmation';
        this.emitEvent({
          type: 'step_progress',
          planId: plan.id,
          stepId: step.id,
          title: step.title,
          description: actionReq.confirmationPrompt || 'Waiting for user confirmation',
          status: 'waiting_confirmation',
          timestamp: Date.now()
        });

        return {
          message: {
            id: `msg_${timestamp}`,
            sender: 'agent',
            text: actionReq.confirmationPrompt || `Boss, please confirm: ${step.title}`,
            timestamp,
            language,
            requiresConfirmation: true,
            pendingAction: actionReq,
            steps: plan.steps,
            planId: plan.id
          },
          plan,
          requiresConfirmation: true,
          pendingAction: actionReq
        };
      }

      // Update Step to Running
      step.status = 'running';
      step.startTime = Date.now();
      this.emitEvent({
        type: 'step_start',
        planId: plan.id,
        stepId: step.id,
        title: step.title,
        description: step.description,
        status: 'running',
        timestamp: Date.now()
      });

      // Execute on local Windows Agent
      const result = await this.deviceManager.executeOnDevice(actionReq);
      step.result = result;
      step.endTime = Date.now();
      lastResult = result;

      // Audit Log
      AuditLogger.logAction(userText, actionReq, result);

      if (result.success) {
        step.status = 'completed';
        this.emitEvent({
          type: 'step_complete',
          planId: plan.id,
          stepId: step.id,
          title: step.title,
          description: result.message,
          status: 'completed',
          timestamp: Date.now(),
          data: result.data
        });

        // Context Memory updates
        if (step.tool === 'project_discovery' && result.data && Array.isArray(result.data) && result.data.length > 0) {
          const first = result.data[0];
          this.memory.updateActiveProject(first.name, first.path, first.type);
        } else if (step.tool === 'open_vscode' || step.tool === 'open_application') {
          this.memory.updateActiveApplication(step.args?.name || 'Visual Studio Code');
        } else if (step.tool === 'open_vscode_project' && step.args?.path) {
          const pName = step.args.path.split(/[\\/]/).pop() || 'Project';
          this.memory.updateActiveProject(pName, step.args.path);
        }
      } else {
        step.status = 'failed';
        step.error = result.error || result.message;
        this.emitEvent({
          type: 'step_fail',
          planId: plan.id,
          stepId: step.id,
          title: step.title,
          description: result.message,
          status: 'failed',
          timestamp: Date.now(),
          data: result.error
        });

        // Safe recovery / Natural error explanation
        const errorSpeech = MultilingualEngine.generateNaturalResponse('error', language, {
          details: result.message
        });

        this.memory.addMessage('assistant', errorSpeech);

        return {
          message: {
            id: `msg_${timestamp}`,
            sender: 'agent',
            text: errorSpeech,
            timestamp,
            language,
            steps: plan.steps,
            planId: plan.id
          },
          plan
        };
      }
    }

    plan.status = 'completed';
    plan.updatedAt = Date.now();

    // Generate Final Natural Multilingual Response
    finalSpeech = MultilingualEngine.generateNaturalResponse('completed', language, {
      targetName: parsedIntent.entities.projectName || parsedIntent.entities.appName || plan.summary
    });

    this.memory.addMessage('assistant', finalSpeech);

    return {
      message: {
        id: `msg_${timestamp}`,
        sender: 'agent',
        text: finalSpeech,
        timestamp,
        language,
        steps: plan.steps,
        planId: plan.id,
        isVoice
      },
      plan
    };
  }

  public async handleConfirmationDecision(
    actionRequest: ActionRequest,
    approved: boolean,
    planId?: string
  ): Promise<ActionResult> {
    if (!approved) {
      return {
        id: actionRequest.id,
        tool: actionRequest.tool,
        success: false,
        message: 'Action was denied by user',
        verified: true
      };
    }

    const result = await this.deviceManager.executeOnDevice(actionRequest);
    AuditLogger.logAction('Confirmed Action', actionRequest, result);

    if (planId && this.activePlans.has(planId)) {
      const plan = this.activePlans.get(planId)!;
      const step = plan.steps.find(s => s.tool === actionRequest.tool);
      if (step) {
        step.status = result.success ? 'completed' : 'failed';
        step.result = result;
      }
    }

    return result;
  }
}
