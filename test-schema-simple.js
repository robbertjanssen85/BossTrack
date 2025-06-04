// Simple database schema test
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🗄️  Checking BossTrack Database Schema...');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const tables = ['trips', 'locations', 'users'];
    
    for (const table of tables) {
        console.log(`📋 Checking table: ${table}`);
        
        try {
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.log(`   ❌ Error: ${error.message}`);
            } else {
                console.log(`   ✅ Table exists (${count || 0} rows)`);
            }
        } catch (err) {
            console.log(`   ❌ Exception: ${err.message}`);
        }
    }
}

checkTables().then(() => {
    console.log('✅ Schema check completed');
}).catch(err => {
    console.error('❌ Error:', err.message);
});
