import { sendSuccess, handleCors } from '../lib/_utils/response.js';

export default async function handler(req, res) {
  // Handle CORS first
  if (handleCors(req, res)) {
    return;
  }

  try {
    console.log('Health check called from:', req.headers['user-agent']);
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
    });

    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime(),
      debug: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
      }
    };

    return sendSuccess(res, healthData);
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Health check failed',
        details: error.message,
      },
    });
  }
}