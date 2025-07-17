const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function addMetadataColumn() {
  console.log('Adding metadata column to incomes table...');
  
  try {
    // Check if column exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'incomes')
      .eq('column_name', 'metadata');
    
    if (columnError) {
      console.error('Error checking column:', columnError);
      return false;
    }
    
    if (columns && columns.length > 0) {
      console.log('Metadata column already exists');
      return true;
    }
    
    // Add metadata column using SQL
    const { data, error } = await supabase.rpc('sql', {
      query: `
        ALTER TABLE incomes ADD COLUMN IF NOT EXISTS metadata JSONB;
      `
    });
    
    if (error) {
      console.error('Error adding metadata column:', error);
      return false;
    }
    
    console.log('Metadata column added successfully');
    return true;
    
  } catch (error) {
    console.error('Migration error:', error);
    return false;
  }
}

async function main() {
  console.log('Starting database migration...');
  
  const success = await addMetadataColumn();
  
  if (success) {
    console.log('Migration completed successfully!');
    process.exit(0);
  } else {
    console.log('Migration failed!');
    process.exit(1);
  }
}

main();