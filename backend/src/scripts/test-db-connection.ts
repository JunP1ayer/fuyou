import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';

async function testDatabaseConnection() {
  try {
    logger.info('Testing Supabase connection...');
    
    // Test basic connection
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      logger.error('Database connection failed:', error);
      return false;
    }
    
    logger.info('✅ Database connection successful!');
    
    // Test authentication
    const { error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      logger.warn('Auth test failed, but this is expected without a session:', authError.message);
    } else {
      logger.info('✅ Auth system is accessible');
    }
    
    return true;
    
  } catch (error) {
    logger.error('Connection test failed:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testDatabaseConnection().then(success => {
    if (success) {
      logger.info('🎉 All database tests passed!');
      process.exit(0);
    } else {
      logger.error('❌ Database tests failed!');
      process.exit(1);
    }
  });
}

export { testDatabaseConnection };