const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function migrateSchema() {
  console.log('Starting schema migration...');
  
  try {
    // Direct SQL execution using Supabase's SQL function
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add metadata column to incomes table if it doesn't exist
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'incomes' AND column_name = 'metadata'
            ) THEN
                ALTER TABLE incomes ADD COLUMN metadata JSONB;
                RAISE NOTICE 'Added metadata column to incomes table';
            ELSE
                RAISE NOTICE 'Metadata column already exists';
            END IF;
        END $$;
      `
    });
    
    if (error) {
      // Try alternative approach with direct alter table
      console.log('Trying alternative approach...');
      const { data: altData, error: altError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE incomes ADD COLUMN IF NOT EXISTS metadata JSONB;'
      });
      
      if (altError) {
        console.error('Alternative approach failed:', altError);
        return false;
      }
      
      console.log('Alternative approach successful');
      return true;
    }
    
    console.log('Schema migration completed successfully');
    return true;
    
  } catch (error) {
    console.error('Migration error:', error);
    return false;
  }
}

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('incomes')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }
    
    console.log('Connection test successful');
    return true;
    
  } catch (error) {
    console.error('Connection error:', error);
    return false;
  }
}

async function main() {
  console.log('Starting database migration process...');
  
  const connected = await testConnection();
  if (!connected) {
    console.log('Database connection failed!');
    process.exit(1);
  }
  
  const success = await migrateSchema();
  
  if (success) {
    console.log('Migration completed successfully!');
    process.exit(0);
  } else {
    console.log('Migration failed!');
    process.exit(1);
  }
}

main();