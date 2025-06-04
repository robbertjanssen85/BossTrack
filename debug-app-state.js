// Debug script to check app state and test data insertion
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('🔍 Debugging App State...\n');

async function checkAppState() {
    try {
        // Check users table
        console.log('👤 Checking users...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*');
        
        if (usersError) {
            console.log('❌ Users error:', usersError.message);
        } else {
            console.log(`✅ Found ${users.length} users`);
            users.forEach(user => {
                console.log(`   - ${user.id}: ${user.email || 'No email'}, consented: ${user.consented}`);
            });
        }

        // Check trips table
        console.log('\n🚗 Checking trips...');
        const { data: trips, error: tripsError } = await supabase
            .from('trips')
            .select('*');
        
        if (tripsError) {
            console.log('❌ Trips error:', tripsError.message);
        } else {
            console.log(`✅ Found ${trips.length} trips`);
            trips.forEach(trip => {
                console.log(`   - ${trip.id}: ${trip.status}, started: ${trip.start_time}`);
            });
        }

        // Check locations table
        console.log('\n📍 Checking locations...');
        const { data: locations, error: locationsError } = await supabase
            .from('locations')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(5);
        
        if (locationsError) {
            console.log('❌ Locations error:', locationsError.message);
        } else {
            console.log(`✅ Found ${locations.length} recent locations`);
            locations.forEach(location => {
                console.log(`   - ${location.id}: ${location.latitude}, ${location.longitude} @ ${location.timestamp}`);
            });
        }

        // Test inserting a mock user and trip
        console.log('\n🧪 Testing data insertion...');
        
        // Create test user
        const testUserId = 'test-' + Date.now();
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({
                id: testUserId,
                email: 'test@example.com',
                consented: true,
                consent_timestamp: new Date().toISOString()
            })
            .select()
            .single();

        if (userError) {
            console.log('❌ Failed to create test user:', userError.message);
        } else {
            console.log('✅ Created test user:', newUser.id);

            // Create test trip
            const { data: newTrip, error: tripError } = await supabase
                .from('trips')
                .insert({
                    user_id: testUserId,
                    start_time: new Date().toISOString(),
                    status: 'active'
                })
                .select()
                .single();

            if (tripError) {
                console.log('❌ Failed to create test trip:', tripError.message);
            } else {
                console.log('✅ Created test trip:', newTrip.id);

                // Create test location
                const { data: newLocation, error: locationError } = await supabase
                    .from('locations')
                    .insert({
                        trip_id: newTrip.id,
                        user_id: testUserId,
                        latitude: 37.7749,
                        longitude: -122.4194,
                        timestamp: new Date().toISOString(),
                        speed: 5.0,
                        bearing: 90.0,
                        accuracy: 10.0
                    })
                    .select()
                    .single();

                if (locationError) {
                    console.log('❌ Failed to create test location:', locationError.message);
                } else {
                    console.log('✅ Created test location:', newLocation.id);
                    console.log('✅ Data flow is working! The issue is likely in the app.');
                }
            }
        }

    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
    }
}

checkAppState();
