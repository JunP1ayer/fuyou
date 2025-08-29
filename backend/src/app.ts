// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
// Use process.cwd() to get the backend directory when running npm run dev
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { incomeRoutes } from './routes/incomes';
import { calculationRoutes } from './routes/calculations';
import { csvRoutes } from './routes/csv';
import { alertRoutes } from './routes/alerts';
import { demoRoutes } from './routes/demo';
import { shiftRoutes } from './routes/shifts';
import { gpt5ShiftAnalyzerRoutes } from './routes/gpt5ShiftAnalyzer';
import ocrRoutes from './routes/ocr'; // Re-enabled for OpenAI integration
import fileOcrRoutes from './routes/fileOcr'; // AI-powered file analysis
import intelligentOCRRoutes from './routes/intelligentOCR'; // Intelligent multi-AI OCR integration
import userProfileRoutes from './routes/userProfile'; // User profile and name settings
import rulesRoutes from './routes/rules';
import logsRoutes from './routes/logs';
import jobSourcesRouter from './routes/jobSources'; // Job sources management
// import designTokenRoutes from './routes/designTokens'; // Transparent Figma integration
// import intelligenceRoutes from './routes/intelligence'; // Gemini-style AI intelligence
// import { optimizationRoutes } from './routes/optimization'; // Temporarily disabled

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet());

// CORS configuration with proper origin handling
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const defaultAllowed = [
      'http://localhost:3000',
      'http://172.26.93.180:3000',
      'http://localhost:5173',
      'http://172.26.93.180:5173',
      'http://localhost:3002',
      'http://172.26.93.180:3002',
      'http://localhost:3003',
      'http://172.26.93.180:3003',
      'http://localhost:4001',
      'http://localhost:4002',
      'http://localhost:4004',
      'http://localhost:4009',
      'http://localhost:4010',
      'http://localhost:4011',
      'http://172.26.93.180:4001',
      'http://172.26.93.180:4002',
      'http://172.26.93.180:4004',
      'http://172.26.93.180:4009',
      'http://172.26.93.180:4010',
      'http://172.26.93.180:4011',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
      'http://127.0.0.1:4001',
      'http://127.0.0.1:4002',
      'http://127.0.0.1:4004',
      'http://127.0.0.1:4009',
      'http://127.0.0.1:4010',
      'http://127.0.0.1:4011'
    ];

    // Additional origins from env (comma-separated)
    const envOrigins = (process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || '')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

    const allowedOrigins = [...defaultAllowed, ...envOrigins];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Body parsing middleware (increase limits for large Data URLs)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/calculations', calculationRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/gpt5-shift-analyzer', gpt5ShiftAnalyzerRoutes); // GPT-5 shift analysis
app.use('/api/job-sources', jobSourcesRouter); // Job sources management
app.use('/api/ocr', ocrRoutes); // Re-enabled for OpenAI integration
app.use('/api/file-ocr', fileOcrRoutes); // AI-powered file analysis
app.use('/api/intelligent-ocr', intelligentOCRRoutes); // Intelligent multi-AI OCR integration
app.use('/api/user-profile', userProfileRoutes); // User profile and name settings
app.use('/api/rules', rulesRoutes);
app.use('/api/logs', logsRoutes);
// app.use('/api/design', designTokenRoutes); // Transparent Figma design system integration
// app.use('/api/intelligence', intelligenceRoutes); // Gemini-style AI intelligence system
// app.use('/api/optimization', optimizationRoutes); // Temporarily disabled for debugging

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
    logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔐 CORS_ORIGIN: ${process.env.CORS_ORIGIN || 'not set'}`);
    logger.info(`🌐 JWT_SECRET: ${process.env.JWT_SECRET ? 'set' : 'not set'}`);
    logger.info(`🔑 SUPABASE_URL: ${process.env.SUPABASE_URL ? 'set' : 'not set'}`);
    
    // Debug: Show current working directory
    logger.info(`📁 Current working directory: ${process.cwd()}`);
    logger.info(`📁 Environment file path: ${envPath}`);
    // Warm rules cache and optionally start auto refresh
    // warmUpRulesCache().catch(() => undefined);
    // startRulesAutoRefresh();
  });
}

export default app;
