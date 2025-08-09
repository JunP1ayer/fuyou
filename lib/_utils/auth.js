import { supabase } from './supabase.js';

// Demo authentication middleware for development
export const requireAuthOrDemo = async (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = authHeader.substring(7);
  
  // Check if it's a demo token (Base64 encoded JSON)
  try {
    const decodedData = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decodedData.user && decodedData.user.id && decodedData.user.email) {
      // It's a valid demo token
      return {
        id: decodedData.user.id,
        email: decodedData.user.email,
        fullName: decodedData.user.fullName,
        isStudent: decodedData.user.isStudent,
        createdAt: decodedData.user.createdAt,
        updatedAt: decodedData.user.createdAt,
      };
    }
  } catch (demoError) {
    // Not a demo token, try regular auth
  }
  
  // Try regular Supabase authentication
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Authentication failed');
  }
  
  return {
    id: user.id,
    email: user.email,
    fullName: user.user_metadata?.fullName || user.email,
    isStudent: user.user_metadata?.isStudent || true,
    createdAt: user.created_at,
    updatedAt: user.updated_at || user.created_at,
  };
};

export const extractUser = async (req) => {
  try {
    return await requireAuthOrDemo(req);
  } catch (error) {
    return null;
  }
};