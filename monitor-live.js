#!/usr/bin/env node

/**
 * BossTrack Live Monitor
 * Real-time monitoring of GPS data flowing into Supabase
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

async function monitorData() {
    console.log('📊 BossTrack Live Monitor Started');
    console.log('Watching for new trips and GPS locations...\n');

    let lastTripCount = 0;
    let lastLocationCount = 0;

    setInterval(async () => {
        try {
            // Check trips table
            const { count: tripCount, error: tripError } = await supabase
                .from('trips')
                .select('*', { count: 'exact', head: true });

            // Check locations table
            const { count: locationCount, error: locationError } = await supabase
                .from('locations')
                .select('*', { count: 'exact', head: true });

            if (tripError || locationError) {
                console.log('⚠️  Database query error:', tripError?.message || locationError?.message);
                return;
            }

            const currentTime = new Date().toLocaleTimeString();
            
            // Show counts and changes
            if (tripCount !== lastTripCount || locationCount !== lastLocationCount) {
                console.log(`[${currentTime}] 📊 Data Update:`);
                console.log(`   Trips: ${tripCount || 0} (${tripCount > lastTripCount ? '+' + (tripCount - lastTripCount) : 'no change'})`);
                console.log(`   Locations: ${locationCount || 0} (${locationCount > lastLocationCount ? '+' + (locationCount - lastLocationCount) : 'no change'})`);
                
                // Show recent data if there are new entries
                if (locationCount > lastLocationCount) {
                    const { data: recentLocations } = await supabase
                        .from('locations')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .limit(3);
                    
                    if (recentLocations && recentLocations.length > 0) {
                        console.log('   📍 Recent GPS points:');
                        recentLocations.forEach(loc => {
                            console.log(`      ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)} (±${loc.accuracy}m)`);
                        });
                    }
                }
                console.log('');
                
                lastTripCount = tripCount || 0;
                lastLocationCount = locationCount || 0;
            }

        } catch (error) {
            console.log('❌ Monitor error:', error.message);
        }
    }, 5000); // Check every 5 seconds
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Monitor stopped. Final summary:');
    console.log(`   Total trips monitored: ${lastTripCount}`);
    console.log(`   Total locations monitored: ${lastLocationCount}`);
    process.exit(0);
});

// Start monitoring
monitorData().catch(console.error);
