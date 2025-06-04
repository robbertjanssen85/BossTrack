// Complete flow test
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('🔍 Testing Complete App Flow...\n');

async function testCompleteFlow() {
    try {
        // Step 1: Clear test data first
        console.log('🧹 Cleaning up old test data...');
        await supabase.from('locations').delete().like('user_id', 'test-%');
        await supabase.from('trips').delete().like('user_id', 'test-%');
        await supabase.from('users').delete().like('id', 'test-%');

        // Step 2: Test user creation (consent flow)
        console.log('👤 Step 1: Testing user consent...');
        const testUserId = 'test-' + Date.now();
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
                id: testUserId,
                email: 'test@bosstrack.com',
                consented: true,
                consent_timestamp: new Date().toISOString()
            })
            .select()
            .single();

        if (userError) {
            throw new Error(`User creation failed: ${userError.message}`);
        }
        console.log('✅ User created:', newUser.id);

        // Step 3: Test trip creation (start tracking)
        console.log('🚗 Step 2: Testing trip start...');
        const { data: newTrip, error: tripError } = await supabase
            .from('trips')
            .insert({
                user_id: testUserId,
                start_time: new Date().toISOString(),
                status: 'active',
                vehicle_id: 'TEST-VAN'
            })
            .select()
            .single();

        if (tripError) {
            throw new Error(`Trip creation failed: ${tripError.message}`);
        }
        console.log('✅ Trip created:', newTrip.id);

        // Step 4: Test location creation (GPS data)
        console.log('📍 Step 3: Testing GPS location upload...');
        const testLocations = [];
        
        // Create 5 test locations (simulating 5 seconds of GPS data)
        for (let i = 0; i < 5; i++) {
            const location = {
                trip_id: newTrip.id,
                user_id: testUserId,
                latitude: 37.7749 + (i * 0.001), // Move slightly north
                longitude: -122.4194 + (i * 0.001), // Move slightly east
                timestamp: new Date(Date.now() + (i * 1000)).toISOString(),
                speed: 5.0 + (i * 2), // Accelerating
                bearing: 45.0,
                accuracy: 5.0
            };
            testLocations.push(location);
        }

        const { data: locations, error: locationError } = await supabase
            .from('locations')
            .insert(testLocations)
            .select();

        if (locationError) {
            throw new Error(`Location creation failed: ${locationError.message}`);
        }
        console.log(`✅ ${locations.length} locations created`);

        // Step 5: Test trip completion
        console.log('🏁 Step 4: Testing trip completion...');
        const { data: completedTrip, error: completeError } = await supabase
            .from('trips')
            .update({
                end_time: new Date().toISOString(),
                status: 'completed',
                duration_seconds: 5,
                distance_km: 0.1
            })
            .eq('id', newTrip.id)
            .select()
            .single();

        if (completeError) {
            throw new Error(`Trip completion failed: ${completeError.message}`);
        }
        console.log('✅ Trip completed:', completedTrip.id);

        // Step 6: Verify final data
        console.log('📊 Step 5: Verifying final data...');
        const { data: finalTrips } = await supabase
            .from('trips')
            .select('*')
            .eq('user_id', testUserId);

        const { data: finalLocations } = await supabase
            .from('locations')
            .select('*')
            .eq('user_id', testUserId);

        console.log('\n🎉 TEST RESULTS:');
        console.log(`   Users: 1 created`);
        console.log(`   Trips: ${finalTrips.length} created`);
        console.log(`   Locations: ${finalLocations.length} created`);
        console.log(`   Trip Status: ${finalTrips[0]?.status}`);
        console.log(`   Duration: ${finalTrips[0]?.duration_seconds}s`);
        console.log(`   Distance: ${finalTrips[0]?.distance_km}km`);

        console.log('\n✅ ALL TESTS PASSED! The database flow works perfectly.');
        console.log('\n💡 Issue Analysis:');
        console.log('   - Database connection: ✅ Working');
        console.log('   - Data flow: ✅ Working');
        console.log('   - The issue is likely:');
        console.log('     📱 App not reaching tracking state on iPhone');
        console.log('     🔐 Location permissions not granted');
        console.log('     📍 Location service not starting properly');
        console.log('     🔄 App state not updating correctly');

        console.log('\n🔍 Next Steps:');
        console.log('   1. Check if you completed consent on iPhone');
        console.log('   2. Check if you pressed "Start Tracking" button');
        console.log('   3. Check if location permission dialog appeared');
        console.log('   4. Check if app shows "Tracking Active" state');
        console.log('   5. Try moving around to generate GPS data');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCompleteFlow();
