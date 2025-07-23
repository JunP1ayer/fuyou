import { supabase } from '../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import type { UserProfile, UpdateUserProfileRequest } from '../types/api';

/**
 * ユーザープロフィール管理サービス
 * シフトフィルタリング用の名前設定とOCR設定を管理
 */
export class UserProfileService {
  
  /**
   * ユーザープロフィール取得
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    console.log(`Getting user profile for user: ${userId}`);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // プロフィールが存在しない場合、デフォルトプロフィールを作成
        return this.createDefaultProfile(userId);
      }
      console.error('Database error:', error);
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return this.mapDatabaseToProfile(data);
  }

  /**
   * ユーザープロフィール更新
   */
  async updateUserProfile(userId: string, updateData: UpdateUserProfileRequest): Promise<UserProfile> {
    console.log(`Updating user profile for user: ${userId}`);

    const updatePayload = {
      display_name: updateData.displayName,
      shift_filter_name: updateData.shiftFilterName,
      timezone: updateData.timezone || 'Asia/Tokyo',
      preferences: updateData.preferences || {},
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updatePayload)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return this.mapDatabaseToProfile(data);
  }

  /**
   * 初回プロフィール設定
   */
  async initializeUserProfile(userId: string, profileData: UpdateUserProfileRequest): Promise<UserProfile> {
    console.log(`Initializing user profile for user: ${userId}`);

    const profileId = uuidv4();
    const now = new Date().toISOString();

    const insertPayload = {
      id: profileId,
      user_id: userId,
      display_name: profileData.displayName,
      shift_filter_name: profileData.shiftFilterName,
      timezone: profileData.timezone || 'Asia/Tokyo',
      preferences: profileData.preferences || {
        defaultHourlyRate: 1000,
        defaultBreakMinutes: 60,
        autoConfirmHighConfidence: false,
        ocrConfidenceThreshold: 0.7,
      },
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to initialize user profile: ${error.message}`);
    }

    return this.mapDatabaseToProfile(data);
  }

  /**
   * シフトフィルタリング用の名前取得
   */
  async getShiftFilterName(userId: string): Promise<string | null> {
    console.log(`Getting shift filter name for user: ${userId}`);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('shift_filter_name')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // プロフィールが存在しない場合
        return null;
      }
      console.error('Database error:', error);
      throw new Error(`Failed to get shift filter name: ${error.message}`);
    }

    return data.shift_filter_name || null;
  }

  /**
   * デフォルトプロフィール作成
   */
  private async createDefaultProfile(userId: string): Promise<UserProfile> {
    console.log(`Creating default profile for user: ${userId}`);

    const profileId = uuidv4();
    const now = new Date().toISOString();

    const defaultProfile = {
      id: profileId,
      user_id: userId,
      display_name: null,
      shift_filter_name: null,
      timezone: 'Asia/Tokyo',
      preferences: {
        defaultHourlyRate: 1000,
        defaultBreakMinutes: 60,
        autoConfirmHighConfidence: false,
        ocrConfidenceThreshold: 0.7,
      },
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(defaultProfile)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to create default profile: ${error.message}`);
    }

    return this.mapDatabaseToProfile(data);
  }

  /**
   * データベース行をProfileオブジェクトにマッピング
   */
  private mapDatabaseToProfile(data: any): UserProfile {
    return {
      id: data.id,
      userId: data.user_id,
      displayName: data.display_name,
      shiftFilterName: data.shift_filter_name,
      timezone: data.timezone,
      preferences: data.preferences || {
        defaultHourlyRate: 1000,
        defaultBreakMinutes: 60,
        autoConfirmHighConfidence: false,
        ocrConfidenceThreshold: 0.7,
      },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * プロフィール存在チェック
   */
  async profileExists(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  }

  /**
   * OCR設定取得
   */
  async getOCRPreferences(userId: string): Promise<{
    autoConfirmHighConfidence: boolean;
    ocrConfidenceThreshold: number;
    defaultHourlyRate: number;
    defaultBreakMinutes: number;
  }> {
    const profile = await this.getUserProfile(userId);
    
    return {
      autoConfirmHighConfidence: profile.preferences.autoConfirmHighConfidence || false,
      ocrConfidenceThreshold: profile.preferences.ocrConfidenceThreshold || 0.7,
      defaultHourlyRate: profile.preferences.defaultHourlyRate || 1000,
      defaultBreakMinutes: profile.preferences.defaultBreakMinutes || 60,
    };
  }
}

// シングルトンインスタンス
export const userProfileService = new UserProfileService();