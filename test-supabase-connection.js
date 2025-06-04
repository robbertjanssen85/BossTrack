#!/usr/bin/env node

/**
 * Simple Supabase Connection Test
 * Tests the connection to your Supabase instance
 */

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase Connection...\n');

  try {
    // Load dependencies
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config();

    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    console.log(`📍 Supabase URL: ${supabaseUrl}`);
    console.log(`🔑 Anon Key: ${supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET'}\n`);
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase credentials in .env file');
      process.exit(1);
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');

    // Test connection with a simple query
    console.log('🧪 Testing connection...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ Table "users" does not exist yet - this is normal for a new setup');
        console.log('✅ Connection successful! You need to create the database schema.');
        console.log('\n📋 Next Steps:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the SQL schema from PRODUCTION_SETUP.md');
      } else {
        console.log('❌ Connection error:', error.message);
        console.log('🔍 Error details:', error);
        process.exit(1);
      }
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('✅ Database schema is already set up');
    }

    // Test auth (check if auth is configured)
    console.log('\n🔐 Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else {
      console.log('✅ Authentication service is working');
      console.log(`ℹ️ Current session: ${authData.session ? 'Active' : 'None'}`);
    }

    console.log('\n🎉 Supabase connection test completed!');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('Error stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testSupabaseConnection().catch((error) => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
