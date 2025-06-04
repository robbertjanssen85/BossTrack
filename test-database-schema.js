#!/usr/bin/env node

/**
 * BossTrack Database Schema Checker
 * Tests database tables and schema for GPS tracking data
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
    console.log('🗄️  Checking BossTrack Database Schema...\n');

    try {
        // Check if main tables exist
        const tables = ['trips', 'locations', 'users'];
        
        for (const table of tables) {
            console.log(`📋 Checking table: ${table}`);
            
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                if (error.code === 'PGRST116') {
                    console.log(`   ❌ Table '${table}' does not exist`);
                } else {
                    console.log(`   ⚠️  Error accessing '${table}': ${error.message}`);
                }
            } else {
                console.log(`   ✅ Table '${table}' exists (${count || 0} rows)`);
            }
        }

        // Test insert capability
        console.log('\n🧪 Testing insert capabilities...');
        
        // Test a simple insert to trips table
        const testTrip = {
            id: 'test-trip-' + Date.now(),
            user_id: 'test-user',
            start_time: new Date().toISOString(),
            status: 'active',
            created_at: new Date().toISOString()
        };

        const { data: tripData, error: tripError } = await supabase
            .from('trips')
            .insert([testTrip])
            .select();

        if (tripError) {
            console.log(`   ❌ Cannot insert to trips table: ${tripError.message}`);
        } else {
            console.log(`   ✅ Successfully inserted test trip`);
            
            // Clean up test data
            await supabase
                .from('trips')
                .delete()
                .eq('id', testTrip.id);
        }

        // Test location insert
        const testLocation = {
            trip_id: 'test-trip-123',
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 5.0,
            timestamp: new Date().toISOString(),
            created_at: new Date().toISOString()
        };

        const { data: locationData, error: locationError } = await supabase
            .from('locations')
            .insert([testLocation])
            .select();

        if (locationError) {
            console.log(`   ❌ Cannot insert to locations table: ${locationError.message}`);
        } else {
            console.log(`   ✅ Successfully inserted test location`);
            
            // Clean up test data
            await supabase
                .from('locations')
                .delete()
                .eq('trip_id', testLocation.trip_id);
        }

        console.log('\n🎉 Database schema check completed!');
        console.log('📱 Your app should now be able to store GPS data.');

    } catch (error) {
        console.error('❌ Database schema check failed:', error.message);
        process.exit(1);
    }
}

// Run the schema check
checkDatabaseSchema().catch(console.error);
