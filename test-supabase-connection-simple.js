const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🧪 Testing Supabase Connection...\n');

// Read environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const developmentMode = process.env.DEVELOPMENT_MODE;

console.log('📋 Environment Configuration:');
console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
console.log(`   DEVELOPMENT_MODE: ${developmentMode}`);
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Test connection
async function testConnection() {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('🔗 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "users" does not exist')) {
        console.log('⚠️  Database tables not created yet');
        console.log('   You need to run the SQL schema from PRODUCTION_SETUP.md');
        return false;
      } else {
        console.log('❌ Connection failed:', error.message);
        return false;
      }
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('✅ Database tables are accessible');
    return true;
    
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Ready to test GPS data upload!');
    console.log('📱 Now test the app on your iPhone:');
    console.log('   1. Open BossTrack app');
    console.log('   2. Complete consent form');
    console.log('   3. Start a trip');
    console.log('   4. Move around to generate GPS data');
    console.log('   5. Check Supabase dashboard for data');
  } else {
    console.log('\n🔧 Setup needed before testing the app.');
  }
});
