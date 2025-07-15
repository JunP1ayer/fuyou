import { Request } from 'express';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { 
  RegisterRequest, 
  LoginRequest, 
  ChangePasswordRequest,
  AuthToken,
  AuthUser 
} from '../types/api';

class AuthService {
  async register(data: RegisterRequest): Promise<AuthToken> {
    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            is_student: data.isStudent,
          },
        },
      });

      if (authError) {
        logger.error('Registration error:', authError);
        throw createError(authError.message, 400);
      }

      if (!authData.user) {
        throw createError('Registration failed', 400);
      }

      // Create user profile in our database
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            is_student: data.isStudent,
          },
        ]);

      if (profileError) {
        logger.error('Profile creation error:', profileError);
        throw createError('Failed to create user profile', 500);
      }

      // Return auth token
      return {
        token: authData.session?.access_token || '',
        refreshToken: authData.session?.refresh_token,
        expiresIn: authData.session?.expires_in || 3600,
        user: {
          id: authData.user.id,
          email: data.email,
          fullName: data.fullName,
          isStudent: data.isStudent,
          createdAt: authData.user.created_at,
          updatedAt: authData.user.updated_at || authData.user.created_at,
        },
      };
    } catch (error) {
      logger.error('Registration service error:', error);
      throw error;
    }
  }

  async login(data: LoginRequest): Promise<AuthToken> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError || !authData.user) {
        logger.error('Login error:', authError);
        throw createError('Invalid credentials', 401);
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        logger.error('Profile retrieval error:', profileError);
        throw createError('User profile not found', 404);
      }

      return {
        token: authData.session?.access_token || '',
        refreshToken: authData.session?.refresh_token,
        expiresIn: authData.session?.expires_in || 3600,
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          isStudent: profile.is_student,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        },
      };
    } catch (error) {
      logger.error('Login service error:', error);
      throw error;
    }
  }

  async getCurrentUser(req: Request): Promise<AuthUser> {
    try {
      // Extract JWT token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError('Authentication required', 401);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token with Supabase
      const { data: authData, error: authError } = await supabase.auth.getUser(token);

      if (authError || !authData.user) {
        logger.error('Token verification error:', authError);
        throw createError('Invalid token', 401);
      }

      // Get user profile from database
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        logger.error('Profile retrieval error:', profileError);
        throw createError('User profile not found', 404);
      }

      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        isStudent: profile.is_student,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  }

  async changePassword(req: Request, data: ChangePasswordRequest): Promise<void> {
    try {
      // Extract JWT token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw createError('Authentication required', 401);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify current user
      const { data: authData, error: authError } = await supabase.auth.getUser(token);

      if (authError || !authData.user) {
        logger.error('Token verification error:', authError);
        throw createError('Invalid token', 401);
      }

      // Verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: authData.user.email!,
        password: data.currentPassword,
      });

      if (verifyError) {
        logger.error('Current password verification failed:', verifyError);
        throw createError('Current password is incorrect', 400);
      }

      // Update password using admin client
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        authData.user.id,
        { password: data.newPassword }
      );

      if (updateError) {
        logger.error('Password update error:', updateError);
        throw createError('Failed to update password', 500);
      }

      logger.info(`Password changed successfully for user ${authData.user.id}`);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  async refreshToken(req: Request): Promise<AuthToken> {
    try {
      // Extract refresh token from request body or Authorization header
      const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
      
      if (!refreshToken) {
        throw createError('Refresh token required', 400);
      }

      // Refresh session with Supabase
      const { data: authData, error: authError } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (authError || !authData.session || !authData.user) {
        logger.error('Token refresh error:', authError);
        throw createError('Invalid refresh token', 401);
      }

      // Get user profile from database
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        logger.error('Profile retrieval error:', profileError);
        throw createError('User profile not found', 404);
      }

      return {
        token: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresIn: authData.session.expires_in || 3600,
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name,
          isStudent: profile.is_student,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        },
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();