import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

// Validation middleware factory
export const validateSchema = (schema: any, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req[property]);
    
    if (error) {
      const errorMessage = error.details.map((detail: any) => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errorMessage
        }
      });
    }
    
    next();
  };
};

// Request validation middleware
export const validateRequest = (validations: Array<{ 
  field: string; 
  required?: boolean; 
  type?: 'string' | 'number' | 'boolean' | 'email' | 'date';
  min?: number;
  max?: number;
}>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    
    for (const validation of validations) {
      const value = req.body[validation.field];
      
      // Check if required field is missing
      if (validation.required && (value === undefined || value === null || value === '')) {
        errors.push(`${validation.field} is required`);
        continue;
      }
      
      // Skip validation if field is not provided and not required
      if (!validation.required && (value === undefined || value === null || value === '')) {
        continue;
      }
      
      // Type validation
      if (validation.type) {
        switch (validation.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${validation.field} must be a string`);
            }
            break;
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push(`${validation.field} must be a valid number`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`${validation.field} must be a boolean`);
            }
            break;
          case 'email':
            if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              errors.push(`${validation.field} must be a valid email address`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(value))) {
              errors.push(`${validation.field} must be a valid date`);
            }
            break;
        }
      }
      
      // Length validation for strings
      if (validation.type === 'string' && typeof value === 'string') {
        if (validation.min && value.length < validation.min) {
          errors.push(`${validation.field} must be at least ${validation.min} characters long`);
        }
        if (validation.max && value.length > validation.max) {
          errors.push(`${validation.field} must be no more than ${validation.max} characters long`);
        }
      }
      
      // Range validation for numbers
      if (validation.type === 'number' && typeof value === 'number') {
        if (validation.min && value < validation.min) {
          errors.push(`${validation.field} must be at least ${validation.min}`);
        }
        if (validation.max && value > validation.max) {
          errors.push(`${validation.field} must be no more than ${validation.max}`);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors
        }
      });
    }
    
    next();
  };
};

// Demo authentication middleware for development
export const requireAuthOrDemo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    
    // Check if it's a demo token (Base64 encoded JSON)
    try {
      const decodedData = JSON.parse(Buffer.from(token, 'base64').toString());
      if (decodedData.user && decodedData.user.id === 'demo-user-123') {
        // It's a valid demo token
        req.user = {
          id: decodedData.user.id,
          email: decodedData.user.email,
          fullName: decodedData.user.fullName,
          isStudent: decodedData.user.isStudent,
          createdAt: decodedData.user.createdAt,
          updatedAt: decodedData.user.createdAt,
        };
        return next();
      }
    } catch (demoError) {
      // Not a demo token, try regular auth
    }
    
    // Try regular Supabase authentication
    const user = await authService.getCurrentUser(req);
    req.user = user;
    next();
  } catch (error) {
    const statusCode = (error as any).statusCode || 401;
    const message = (error as any).message || 'Authentication failed';
    
    return res.status(statusCode).json({
      success: false,
      error: { message }
    });
  }
};

// Query validation middleware
export const validateQuery = (schema: any) => {
  return validateSchema(schema, 'query');
};

// Original authentication middleware (kept for compatibility)
export const requireAuth = requireAuthOrDemo;