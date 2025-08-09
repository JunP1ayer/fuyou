import { sendSuccess, sendError, handleCors } from '../_utils/response.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

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