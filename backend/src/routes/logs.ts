import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

const router = Router();

// Basic rate limiting to avoid log flooding
const logsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', logsLimiter, (req: Request, res: Response) => {
  try {
    const {
      level = 'error',
      message,
      details,
      userAgent,
      url,
      traceId,
      timestamp,
    } = req.body || {};

    if (!message && !details) {
      return res.status(400).json({ success: false, error: { message: 'message or details is required' } });
    }

    const logPayload = {
      from: 'frontend',
      message: message || 'Client error',
      details,
      userAgent: userAgent || req.get('User-Agent'),
      url,
      traceId,
      timestamp: timestamp || new Date().toISOString(),
      ip: req.ip,
    };

    switch (String(level).toLowerCase()) {
      case 'warn':
        logger.warn('Client log (warn):', logPayload);
        break;
      case 'info':
        logger.info('Client log (info):', logPayload);
        break;
      case 'error':
      default:
        logger.error('Client log (error):', logPayload);
        break;
    }

    return res.json({ success: true });
  } catch (error) {
    logger.error('Failed to handle client log:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to record log' } });
  }
});

export default router;


