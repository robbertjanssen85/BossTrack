/**
 * Test script to validate user profile creation with real Supabase connection
 * Run with: node test-user-profile.js
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// Import our config
const Config = {
  SUPABASE_URL: 'https://lyrbobtvirbgwlhjmboq.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cmJvYnR2aXJiZ3dsaGptYm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTQ4MDUsImV4cCI6MjA2NDUzMDgwNX0.qF_OM2Ov_TPbjtPyLLFNVrZ9UNYMovfFXRb4g4eCNfQ',
  DEVELOPMENT_MODE: false,
};

async function testUserProfile() {
  console.log('🧪 Testing Supabase User Profile Creation...');
  
  try {
    // Initialize Supabase client
    const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized');

    // Test data
    const testProfile = {
      id: 'test-user-' + Date.now(),
      email: 'test@bosstrack.app',
      full_name: 'Test Driver',
      company_name: 'Test Company',
      phone: '+1-555-0123',
      consent_given: true,
      consent_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📋 Test profile data:', JSON.stringify(testProfile, null, 2));

    // Try to create user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([testProfile])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating user profile:', error);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      console.error('   Hint:', error.hint);
      console.error('   Message:', error.message);
    } else {
      console.log('✅ User profile created successfully!');
      console.log('📄 Created data:', JSON.stringify(data, null, 2));
      
      // Now try to retrieve it
      console.log('📖 Testing profile retrieval...');
      const { data: retrievedData, error: retrieveError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', testProfile.id)
        .single();

      if (retrieveError) {
        console.error('❌ Error retrieving user profile:', retrieveError);
      } else {
        console.log('✅ Profile retrieved successfully!');
        console.log('📄 Retrieved data:', JSON.stringify(retrievedData, null, 2));
      }

      // Clean up - delete test record
      console.log('🧹 Cleaning up test data...');
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testProfile.id);

      if (deleteError) {
        console.error('⚠️ Error deleting test record:', deleteError);
      } else {
        console.log('✅ Test record cleaned up');
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
testUserProfile().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
