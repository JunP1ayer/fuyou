import { sendSuccess, handleCors } from '../lib/_utils/response.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) {
    return;
  }

  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime(),
    };

    return sendSuccess(res, healthData);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Health check failed',
        details: error.message,
      },
    });
  }
}