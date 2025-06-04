/**
 * Quick test to check what fields Supabase actually returns
 */

// Test data that should work
const testInsert = {
  id: 'test-schema-' + Date.now(),
  email: 'schema-test@bosstrack.app',
  full_name: 'Schema Test',
  company_name: 'Test Co',
  phone: '+1-555-0000',
  consent_given: true,
  consent_timestamp: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

console.log('🧪 Test insert data:');
console.log(JSON.stringify(testInsert, null, 2));

console.log('\n📋 Expected fields in response:');
console.log('- id (string)');
console.log('- email (string)'); 
console.log('- full_name (string)');
console.log('- company_name (string)');
console.log('- phone (string)');
console.log('- consent_given (boolean)');
console.log('- consent_timestamp (string)');
console.log('- created_at (string)');
console.log('- updated_at (string)');

console.log('\n🔍 Please check your Supabase dashboard:');
console.log('1. Go to Table Editor');
console.log('2. Look at user_profiles table');
console.log('3. Verify these column names match exactly');
console.log('4. Check if any fields are required/not null');
