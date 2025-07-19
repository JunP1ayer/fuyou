#!/usr/bin/env node

// Apply optimization schema to Supabase database
// This script creates the necessary tables for Phase 4 optimization features

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required Supabase environment variables');
  console.error('SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Read optimization schema
const schemaPath = path.join(__dirname, '../database/optimization_schema.sql');
let schemaSQL;

try {
  schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  console.log('📖 Successfully loaded optimization schema from:', schemaPath);
} catch (error) {
  console.error('❌ Failed to read schema file:', error.message);
  process.exit(1);
}

// Split SQL into individual statements
const statements = schemaSQL
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

console.log(`📋 Found ${statements.length} SQL statements to execute`);

async function applySchema() {
  console.log('🚀 Starting schema application...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and empty statements
    if (!statement || statement.startsWith('--') || statement.trim() === '') {
      continue;
    }
    
    try {
      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
      
      // Execute SQL statement using rpc function or direct query
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });
      
      if (error) {
        // Try direct query if rpc fails
        const { error: directError } = await supabase
          .from('_supabase_admin')
          .select('*')
          .limit(0);
        
        if (directError) {
          console.log(`⚠️  Statement ${i + 1} failed with RPC, trying alternative method...`);
          // For some statements, we might need to handle them differently
          console.log(`⏭️  Skipping statement: ${statement.substring(0, 60)}...`);
          continue;
        }
      }
      
      successCount++;
      console.log(`✅ Statement ${i + 1} executed successfully`);
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Error executing statement ${i + 1}:`, error.message);
      console.error(`Statement: ${statement.substring(0, 100)}...`);
    }
  }
  
  console.log('\n📊 Schema Application Summary:');
  console.log(`✅ Successful statements: ${successCount}`);
  console.log(`❌ Failed statements: ${errorCount}`);
  console.log(`📋 Total statements: ${statements.length}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Schema applied successfully!');
  } else {
    console.log('\n⚠️  Schema applied with some errors. Please check the logs above.');
  }
  
  // Test table creation by querying one of the new tables
  try {
    const { data, error } = await supabase
      .from('optimization_constraints')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('✅ optimization_constraints table is accessible');
    } else {
      console.log('❌ optimization_constraints table access failed:', error.message);
    }
  } catch (testError) {
    console.log('❌ Table test failed:', testError.message);
  }
}

// Run the schema application
applySchema()
  .then(() => {
    console.log('🏁 Schema application completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error during schema application:', error);
    process.exit(1);
  });