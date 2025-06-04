# BossTrack Production Setup Guide

## Overview
This guide helps you configure BossTrack for production use with real Supabase backend integration.

## Current Status
✅ **Complete Authentication Flow** - User registration, consent management, session handling  
✅ **GPS Location Integration** - Real GPS tracking with fallback simulation mode  
✅ **Trip Management** - Start/stop trips, location tracking, data upload simulation  
✅ **Mock Mode Implementation** - Full functionality without real backend  
✅ **TypeScript Integration** - All services properly typed and error-free  

## Production Configuration

### 1. Supabase Project Setup

1. **Create Supabase Project**
   ```bash
   # Visit: https://supabase.com/dashboard
   # Create new project
   # Note your project URL and anon key
   ```

2. **Database Schema**
   Create the following tables in your Supabase project:

   ```sql
   -- Users table
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     first_name VARCHAR(100) NOT NULL,
     last_name VARCHAR(100) NOT NULL,
     company VARCHAR(200),
     phone VARCHAR(20),
     vehicle_plate VARCHAR(20),
     vehicle_type VARCHAR(50),
     consent_timestamp TIMESTAMPTZ NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Trips table
   CREATE TABLE trips (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     start_time TIMESTAMPTZ NOT NULL,
     end_time TIMESTAMPTZ,
     vehicle_id VARCHAR(20),
     status VARCHAR(20) NOT NULL DEFAULT 'active',
     distance_km DECIMAL(10,3),
     duration_seconds INTEGER,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Location data table
   CREATE TABLE location_data (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
     latitude DECIMAL(10,8) NOT NULL,
     longitude DECIMAL(11,8) NOT NULL,
     altitude DECIMAL(8,2),
     accuracy DECIMAL(8,2),
     bearing DECIMAL(5,2),
     speed DECIMAL(8,3),
     timestamp TIMESTAMPTZ NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create indexes for performance
   CREATE INDEX idx_trips_user_id ON trips(user_id);
   CREATE INDEX idx_trips_start_time ON trips(start_time);
   CREATE INDEX idx_location_data_trip_id ON location_data(trip_id);
   CREATE INDEX idx_location_data_timestamp ON location_data(timestamp);
   ```

3. **Row Level Security (RLS)**
   ```sql
   -- Enable RLS
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
   ALTER TABLE location_data ENABLE ROW LEVEL SECURITY;

   -- Users can only access their own data
   CREATE POLICY "Users can view own data" ON users
     FOR SELECT USING (id = auth.uid());

   CREATE POLICY "Users can insert own data" ON users
     FOR INSERT WITH CHECK (id = auth.uid());

   CREATE POLICY "Users can update own data" ON users
     FOR UPDATE USING (id = auth.uid());

   -- Trips policies
   CREATE POLICY "Users can view own trips" ON trips
     FOR SELECT USING (user_id = auth.uid());

   CREATE POLICY "Users can insert own trips" ON trips
     FOR INSERT WITH CHECK (user_id = auth.uid());

   CREATE POLICY "Users can update own trips" ON trips
     FOR UPDATE USING (user_id = auth.uid());

   -- Location data policies
   CREATE POLICY "Users can view own location data" ON location_data
     FOR SELECT USING (trip_id IN (
       SELECT id FROM trips WHERE user_id = auth.uid()
     ));

   CREATE POLICY "Users can insert own location data" ON location_data
     FOR INSERT WITH CHECK (trip_id IN (
       SELECT id FROM trips WHERE user_id = auth.uid()
     ));
   ```

### 2. Environment Configuration

1. **Update .env file**
   ```bash
   # Copy from .env.example
   cp .env.example .env
   
   # Edit with your Supabase credentials
   vim .env
   ```

   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_MOCK_MODE=false
   
   # App Configuration
   APP_NAME=BossTrack
   APP_VERSION=1.0.0
   ```

2. **Update SimpleSupabaseService**
   The service will automatically detect real credentials and switch from mock mode to production mode.

### 3. Authentication Setup

1. **Supabase Auth Configuration**
   - Enable email authentication in Supabase dashboard
   - Configure redirect URLs for your app:
     - **Development:** `exp://localhost:8081`, `http://localhost:8081`
     - **Production:** `bosstrack://auth-callback`
   - Set up email templates (optional)

2. **Update SimpleAuthService**
   No changes needed - the service automatically handles both mock and production modes.

### 4. Testing Production Setup

1. **Run Integration Test**
   ```bash
   node test-integration.js
   ```

2. **Test Real GPS**
   ```bash
   ./test-gps.sh
   ```

3. **Test Complete Flow**
   ```bash
   npx react-native run-ios
   # Test: Consent → Registration → GPS Tracking → Trip Management
   ```

## Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed
- [ ] Row Level Security policies configured
- [ ] Environment variables set with real credentials
- [ ] SUPABASE_MOCK_MODE=false in .env
- [ ] Integration tests passing
- [ ] GPS permissions configured for production
- [ ] Background location permissions enabled (if needed)
- [ ] App Store/Play Store requirements met

## Features Ready for Production

### ✅ Implemented
- **User Authentication** - Complete registration and session management
- **Consent Management** - GDPR-compliant consent with timestamp tracking
- **GPS Integration** - Real device GPS with intelligent fallback
- **Trip Tracking** - Start/stop trips with location recording
- **Data Upload** - Periodic location data upload to Supabase
- **Error Handling** - Comprehensive error handling throughout
- **Mock Mode** - Full development without backend dependency

### 🔄 Future Enhancements
- **Background Tracking** - Location tracking when app is backgrounded
- **Trip Analytics** - Distance, speed, route analysis
- **Data Export** - CSV/JSON export functionality
- **User Profile** - Profile management and settings
- **Offline Mode** - Local storage with sync when online
- **Push Notifications** - Trip reminders and alerts

## Support

For issues or questions:
1. Check the console logs for error details
2. Verify Supabase configuration and credentials
3. Test with SUPABASE_MOCK_MODE=true for debugging
4. Review the integration test output

## Security Notes

- Never commit real credentials to version control
- Use environment variables for all sensitive configuration
- Enable Row Level Security in Supabase
- Regularly rotate API keys
- Monitor usage and access patterns in Supabase dashboard
