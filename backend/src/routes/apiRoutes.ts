import { Router } from 'express';
import { ApiController } from '../controllers/apiController';

const router = Router();

router.post('/chat', ApiController.handleChat);
router.all('/tts', ApiController.handleTTS);
router.get('/tts/voices', ApiController.getTTSVoices);
router.get('/devices', ApiController.getDevices);
router.post('/pair', ApiController.generatePairingCode);
router.post('/confirm', ApiController.handleConfirm);
router.get('/audit', ApiController.getAuditLogs);
router.get('/context', ApiController.getContext);
router.get('/health', ApiController.healthCheck);

export default router;
