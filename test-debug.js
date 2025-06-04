// Quick test with detailed logging
require('dotenv').config();

console.log('1. Loading environment...');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('2. URL exists:', !!supabaseUrl);
console.log('3. Key exists:', !!supabaseKey);

if (supabaseUrl) {
    console.log('4. URL prefix:', supabaseUrl.substring(0, 30) + '...');
}

console.log('5. Loading Supabase client...');
const { createClient } = require('@supabase/supabase-js');

console.log('6. Creating client...');
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('7. Testing simple query...');

// Simple test
supabase
    .from('trips')
    .select('*', { count: 'exact', head: true })
    .then(result => {
        console.log('8. Query result:', {
            data: result.data,
            error: result.error ? result.error.message : null,
            count: result.count
        });
        process.exit(0);
    })
    .catch(err => {
        console.log('8. Query error:', err.message);
        process.exit(1);
    });

// Timeout after 10 seconds
setTimeout(() => {
    console.log('❌ Query timed out after 10 seconds');
    process.exit(1);
}, 10000);
