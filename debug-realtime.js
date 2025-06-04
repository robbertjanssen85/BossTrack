// Real-time debugging tool for iPhone app
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('📱 iPhone App Debugging Tool');
console.log('═'.repeat(50));

let lastCounts = { users: 0, trips: 0, locations: 0 };

async function checkDataCounts() {
    try {
        // Count users
        const { count: userCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        // Count trips
        const { count: tripCount } = await supabase
            .from('trips')
            .select('*', { count: 'exact', head: true });

        // Count locations
        const { count: locationCount } = await supabase
            .from('locations')
            .select('*', { count: 'exact', head: true });

        const now = new Date().toLocaleTimeString();
        const changed = userCount !== lastCounts.users || 
                       tripCount !== lastCounts.trips || 
                       locationCount !== lastCounts.locations;

        if (changed) {
            console.log(`\n[${now}] 📊 DATA CHANGED!`);
            console.log(`   Users: ${lastCounts.users} → ${userCount}`);
            console.log(`   Trips: ${lastCounts.trips} → ${tripCount}`);
            console.log(`   Locations: ${lastCounts.locations} → ${locationCount}`);
            
            // Show recent activity
            if (userCount > lastCounts.users) {
                const { data: newUsers } = await supabase
                    .from('users')
                    .select('*')
                    .order('consent_timestamp', { ascending: false })
                    .limit(3);
                console.log('   📱 New Users:', newUsers.map(u => `${u.id} (${u.email})`));
            }
            
            if (tripCount > lastCounts.trips) {
                const { data: newTrips } = await supabase
                    .from('trips')
                    .select('*')
                    .order('start_time', { ascending: false })
                    .limit(3);
                console.log('   🚗 New Trips:', newTrips.map(t => `${t.id} (${t.status})`));
            }
            
            if (locationCount > lastCounts.locations) {
                const { data: newLocations } = await supabase
                    .from('locations')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(3);
                console.log('   📍 New Locations:', newLocations.map(l => `${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)}`));
            }
            
            lastCounts = { users: userCount, trips: tripCount, locations: locationCount };
        } else {
            process.stdout.write(`\r[${now}] 📊 No changes (U:${userCount} T:${tripCount} L:${locationCount})`);
        }
        
    } catch (error) {
        console.error('\n❌ Error checking data:', error.message);
    }
}

console.log('\n🔍 Monitoring database for changes...');
console.log('💡 Instructions:');
console.log('   1. Open BossTrack app on your iPhone');
console.log('   2. Complete the consent flow');
console.log('   3. Tap "Start Tracking" button');
console.log('   4. Grant location permissions when prompted');
console.log('   5. Move around to generate GPS data');
console.log('\n📊 Current counts:');

// Initial check
checkDataCounts();

// Check every 2 seconds
const interval = setInterval(checkDataCounts, 2000);

// Stop after 5 minutes
setTimeout(() => {
    clearInterval(interval);
    console.log('\n\n⏰ Monitoring stopped after 5 minutes');
    console.log('📋 Summary:');
    console.log(`   Final counts: Users:${lastCounts.users} Trips:${lastCounts.trips} Locations:${lastCounts.locations}`);
    
    if (lastCounts.users === 0) {
        console.log('\n❌ No users found - app might not be reaching consent screen');
    } else if (lastCounts.trips === 0) {
        console.log('\n❌ No trips found - app might not be starting tracking');
    } else if (lastCounts.locations === 0) {
        console.log('\n❌ No locations found - GPS tracking might not be working');
    } else {
        console.log('\n✅ App is working correctly!');
    }
    
    process.exit(0);
}, 300000); // 5 minutes
