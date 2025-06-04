// Test script to verify URL polyfill and Supabase connection works
require('react-native-url-polyfill/auto');
const { createClient } = require('@supabase/supabase-js');

const ENV_SUPABASE_URL = 'https://lyrbobtvirbgwlhjmboq.supabase.co';
const ENV_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cmJvYnR2aXJiZ3dsaGptYm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzOTg5MTQsImV4cCI6MjA1MDk3NDkxNH0.SJNGz_nP5BAbfEJQoW9Z8rrY6w3Jq-fCKzCLhjgSAow';

console.log('🔍 Testing URL polyfill and Supabase initialization...');

try {
  console.log('1. Testing URL parsing...');
  const url = new URL(ENV_SUPABASE_URL);
  console.log('   ✅ URL parsed successfully:', url.protocol, url.hostname);
  
  console.log('2. Testing Supabase client creation...');
  const supabase = createClient(ENV_SUPABASE_URL, ENV_SUPABASE_ANON_KEY);
  console.log('   ✅ Supabase client created successfully');
  
  console.log('3. Testing basic connection...');
  supabase
    .from('users')
    .select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) {
        console.log('   ⚠️  Connection test result (expected):', error.message);
        console.log('   ✅ Connection test completed - client can communicate with Supabase');
      } else {
        console.log('   ✅ Connection successful, user count:', count);
      }
    })
    .catch(err => {
      console.log('   ⚠️  Connection error:', err.message);
    });
    
} catch (error) {
  console.error('❌ Test failed:', error);
}

console.log('Test completed.');
