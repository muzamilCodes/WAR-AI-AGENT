import { Request, Response } from 'express';
import { AgentBrain } from '../agent/brain';
import { DeviceManager } from '../services/deviceManager';
import { AuditLogger } from '../services/auditLogger';

export class ApiController {
  private static brain = AgentBrain.getInstance();
  private static deviceManager = DeviceManager.getInstance();

  public static async handleChat(req: Request, res: Response): Promise<void> {
    try {
      const { text, isVoice, language } = req.body;
      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Field "text" is required' });
        return;
      }

      const result = await ApiController.brain.processUserMessage(text, isVoice, language);
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      console.error('[ApiController] Chat error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static getDevices(_req: Request, res: Response): void {
    const devices = ApiController.deviceManager.getConnectedDevices();
    res.status(200).json({ success: true, devices });
  }

  public static generatePairingCode(_req: Request, res: Response): void {
    const pairing = ApiController.deviceManager.generatePairingCode();
    res.status(200).json({ success: true, ...pairing });
  }

  public static async handleConfirm(req: Request, res: Response): Promise<void> {
    try {
      const { actionRequest, approved, planId } = req.body;
      if (!actionRequest) {
        res.status(400).json({ error: 'Field "actionRequest" is required' });
        return;
      }

      const result = await ApiController.brain.handleConfirmationDecision(actionRequest, approved ?? true, planId);
      res.status(200).json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static getAuditLogs(_req: Request, res: Response): void {
    const logs = AuditLogger.getLogs(100);
    res.status(200).json({ success: true, logs });
  }

  public static getContext(_req: Request, res: Response): void {
    const context = ApiController.brain.getContext();
    res.status(200).json({ success: true, context });
  }

  public static healthCheck(_req: Request, res: Response): void {
    res.status(200).json({
      status: 'healthy',
      service: 'WAR AI Backend Orchestrator',
      version: '1.0.0',
      timestamp: Date.now()
    });
  }
}
