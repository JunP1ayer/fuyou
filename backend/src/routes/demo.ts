import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Helper function to extract name from email
function extractNameFromEmail(email: string): string {
  if (!email) return 'デモユーザー';
  const localPart = email.split('@')[0];
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

const router = Router();

// POST /api/demo/login - Demo login without authentication
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, fullName, isStudent } = req.body;
      
      // Create a demo JWT token with actual input data
      // Priority: fullName from request > extracted from email > default
      let displayName = 'デモユーザー';
      if (fullName && fullName.trim()) {
        displayName = fullName.trim();
      } else if (email) {
        displayName = extractNameFromEmail(email);
      }

      // Generate consistent UUID for demo user based on email
      const demoUserId = email ? 
        uuidv4() : // Generate random UUID for each session
        '550e8400-e29b-41d4-a716-446655440000'; // Fixed UUID for default demo

      const demoUser = {
        id: demoUserId,
        email: email || 'demo@example.com',
        fullName: displayName,
        isStudent: isStudent !== undefined ? isStudent : true,
        createdAt: new Date().toISOString(),
      };

      // Generate a simple demo token
      const demoToken = Buffer.from(JSON.stringify({
        user: demoUser,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
        iat: Math.floor(Date.now() / 1000)
      })).toString('base64');

      logger.info('Demo login successful', { email: demoUser.email, fullName: demoUser.fullName });

      res.json({
        success: true,
        data: {
          token: demoToken,
          user: demoUser,
          expiresIn: 86400, // 24 hours in seconds
        },
      });

    } catch (error) {
      logger.error('Demo login error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Demo login failed' }
      });
    }
  })
);

// GET /api/demo/user - Get demo user info
router.get(
  '/user',
  asyncHandler(async (req: Request, res: Response) => {
    // Try to extract user info from Authorization header (demo token)
    const authHeader = req.headers.authorization;
    let demoUser = {
      id: '550e8400-e29b-41d4-a716-446655440000', // Fixed UUID for default demo
      email: 'demo@example.com',
      fullName: 'デモユーザー',
      isStudent: true,
      createdAt: new Date().toISOString(),
    };

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decodedData = JSON.parse(Buffer.from(token, 'base64').toString());
        if (decodedData.user) {
          demoUser = decodedData.user;
        }
      } catch (error) {
        // If token parsing fails, use default demo user
        logger.warn('Failed to parse demo token:', error);
      }
    }

    res.json({
      success: true,
      data: demoUser,
    });
  })
);

export { router as demoRoutes };