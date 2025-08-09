// Validation helper functions for Vercel functions
export const validateSchema = (schema, data, property = 'body') => {
  try {
    return schema.parse(data);
  } catch (error) {
    const errorMessage = error.errors 
      ? error.errors.map(err => err.message).join(', ')
      : error.message || 'Validation failed';
    
    throw new Error(errorMessage);
  }
};

export const parseRequestData = (req) => {
  const { method } = req;
  
  switch (method) {
    case 'GET':
      return req.query || {};
    case 'POST':
    case 'PUT':
    case 'PATCH':
      return req.body || {};
    default:
      return {};
  }
};