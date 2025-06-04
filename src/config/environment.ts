// Environment configuration for React Native
// Direct import approach for better reliability

// For React Native, we'll use a more direct approach
// These will be replaced by the bundler at build time
const ENV_SUPABASE_URL = 'https://lyrbobtvirbgwlhjmboq.supabase.co';
const ENV_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5cmJvYnR2aXJiZ3dsaGptYm9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NTQ4MDUsImV4cCI6MjA2NDUzMDgwNX0.qF_OM2Ov_TPbjtPyLLFNVrZ9UNYMovfFXRb4g4eCNfQ';

export const Config = {
  SUPABASE_URL: ENV_SUPABASE_URL,
  SUPABASE_ANON_KEY: ENV_SUPABASE_ANON_KEY,
  DEVELOPMENT_MODE: false,
};

// Debug logging
console.log('🔧 Environment Config loaded:');
console.log('   - SUPABASE_URL exists:', !!Config.SUPABASE_URL);
console.log('   - SUPABASE_ANON_KEY exists:', !!Config.SUPABASE_ANON_KEY);
console.log('   - DEVELOPMENT_MODE:', Config.DEVELOPMENT_MODE);
