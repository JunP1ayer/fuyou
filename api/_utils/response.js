// Helper functions for consistent API responses
export const sendSuccess = (res, data, meta = {}) => {
  return res.status(200).json({
    success: true,
    data,
    meta,
  });
};

export const sendCreated = (res, data, meta = {}) => {
  return res.status(201).json({
    success: true,
    data,
    meta,
  });
};

export const sendError = (res, message, code = 'UNKNOWN_ERROR', statusCode = 500, details = null) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details,
    },
  });
};

export const sendValidationError = (res, message, details = null) => {
  return sendError(res, message, 'VALIDATION_ERROR', 400, details);
};

export const sendAuthError = (res, message = 'Authentication required') => {
  return sendError(res, message, 'AUTH_ERROR', 401);
};

export const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, 'NOT_FOUND', 404);
};

export const sendConflict = (res, message, details = null) => {
  return sendError(res, message, 'CONFLICT', 409, details);
};

// CORS middleware for Vercel functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const handleCors = (req, res) => {
  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  
  return false;
};