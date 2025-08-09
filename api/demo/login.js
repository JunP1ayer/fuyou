import { sendSuccess, sendError, sendValidationError, handleCors } from '../../lib/_utils/response.js';
import { v4 as uuidv4 } from 'uuid';

// Helper function to extract name from email
function extractNameFromEmail(email) {
  if (!email) return 'デモユーザー';
  const localPart = email.split('@')[0];
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) {
    return;
  }

  // Handle GET request for demo user info
  if (req.method === 'GET') {
    try {
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
          console.warn('Failed to parse demo token:', error);
        }
      }

      return sendSuccess(res, demoUser);
    } catch (error) {
      console.error('Demo user info error:', error);
      return sendError(res, 'Failed to get demo user info', 'DEMO_USER_ERROR', 500);
    }
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  try {
    const { email, fullName, isStudent } = req.body || {};
    
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

    console.log('Demo login successful', { email: demoUser.email, fullName: demoUser.fullName });

    return sendSuccess(res, {
      token: demoToken,
      user: demoUser,
      expiresIn: 86400, // 24 hours in seconds
    });

  } catch (error) {
    console.error('Demo login error:', error);
    return sendError(res, 'Demo login failed', 'DEMO_LOGIN_ERROR', 500);
  }
}