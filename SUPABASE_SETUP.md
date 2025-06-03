# Supabase Setup Guide for BossTrack

## Overview
This guide walks you through setting up Supabase for the BossTrack application, including database schema creation, authentication configuration, and integration with the React Native app.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/login to your account
3. Click "New Project"
4. Choose your organization
5. Set project name: `BossTrack`
6. Set database password (save this securely!)
7. Choose region closest to your users
8. Click "Create new project"

## 2. Get API Credentials

1. Go to Settings > API in your Supabase dashboard
2. Copy the following:
   - Project URL
   - `anon` `public` key (for client-side use)
3. Update `src/services/SupabaseService.ts`:
   ```typescript
   const SUPABASE_URL = 'https://your-actual-project-ref.supabase.co';
   const SUPABASE_ANON_KEY = 'your-actual-anon-key-here';
   ```

## 3. Database Schema Setup

Run the following SQL commands in the Supabase SQL Editor:

### User Profiles Table
```sql
-- User profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  consent_given BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

### Trips Table
```sql
-- Trips table
CREATE TABLE trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  trip_id TEXT UNIQUE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  vehicle_id TEXT,
  driver_id TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
  distance_km DECIMAL(10,3),
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see/edit their own trips
CREATE POLICY "Users can view own trips" 
  ON trips FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" 
  ON trips FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" 
  ON trips FOR UPDATE 
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX trips_user_id_idx ON trips(user_id);
CREATE INDEX trips_status_idx ON trips(status);
CREATE INDEX trips_start_time_idx ON trips(start_time);
```

### Location Data Table
```sql
-- Location data table
CREATE TABLE location_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id TEXT REFERENCES trips(trip_id) NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  altitude DECIMAL(8,2),
  accuracy DECIMAL(8,2),
  bearing DECIMAL(6,2),
  speed DECIMAL(8,2),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE location_data ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see location data for their own trips
CREATE POLICY "Users can view own location data" 
  ON location_data FOR SELECT 
  USING (
    trip_id IN (
      SELECT trip_id FROM trips WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own location data" 
  ON location_data FOR INSERT 
  WITH CHECK (
    trip_id IN (
      SELECT trip_id FROM trips WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX location_data_trip_id_idx ON location_data(trip_id);
CREATE INDEX location_data_timestamp_idx ON location_data(timestamp);
CREATE INDEX location_data_coords_idx ON location_data(latitude, longitude);
```

### Triggers for Updated Timestamps
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## 4. Authentication Configuration

### Email Templates (Optional)
1. Go to Authentication > Templates
2. Customize email templates for:
   - Confirm signup
   - Reset password
   - Magic link

### Auth Settings
1. Go to Authentication > Settings
2. Configure:
   - Site URL: Your app's URL (for web) or custom scheme (for mobile)
   - Email confirmations: Enable if desired
   - Password requirements: Set according to security needs

## 5. Storage Setup (Optional)

If you plan to store files (trip exports, user photos, etc.):

```sql
-- Create a bucket for trip data
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trip-data', 'trip-data', false);

-- Policy for trip data bucket
CREATE POLICY "Users can upload trip data" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'trip-data' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own trip data" 
  ON storage.objects FOR SELECT 
  USING (
    bucket_id = 'trip-data' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 6. Testing the Setup

### Test Authentication
```javascript
// In your app or Supabase dashboard
const { user, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'securepassword123'
});
```

### Test Data Insertion
```javascript
// Create a user profile
const { data, error } = await supabase
  .from('user_profiles')
  .insert([
    {
      id: user.id,
      email: user.email,
      full_name: 'Test User',
      consent_given: true,
      consent_timestamp: new Date().toISOString()
    }
  ]);
```

## 7. Security Considerations

### Row Level Security (RLS)
- ✅ All tables have RLS enabled
- ✅ Users can only access their own data
- ✅ Policies prevent data leakage between users

### API Key Security
- ✅ Use `anon` key for client-side (safe to expose)
- ❗ Never expose `service_role` key in client code
- ✅ All sensitive operations go through RLS policies

### Data Privacy
- ✅ Location data is protected by user isolation
- ✅ Trip data cannot be accessed across users
- ✅ Consent tracking is implemented

## 8. Production Checklist

Before going live:
- [ ] Set up proper domain in Supabase settings
- [ ] Configure email templates with your branding
- [ ] Set up database backups
- [ ] Monitor usage and set up billing alerts
- [ ] Test all authentication flows
- [ ] Verify RLS policies work correctly
- [ ] Set up error monitoring
- [ ] Configure CORS settings if needed

## 9. Environment Variables

Create a `.env` file (DO NOT commit to git):
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Add `.env` to your `.gitignore` file.

## 10. Integration with BossTrack

The `SupabaseService` in `src/services/SupabaseService.ts` handles:
- ✅ User authentication (signup, signin, signout)
- ✅ User profile management
- ✅ Trip creation and management
- ✅ Location data storage and retrieval
- ✅ Consent tracking
- ✅ Trip history and analytics
- ✅ Mock mode when not configured

## Support

For issues:
1. Check Supabase documentation: https://supabase.com/docs
2. Supabase Discord: https://discord.supabase.com
3. GitHub issues for this project

## Next Steps

After setup:
1. Update authentication in BossTrack app
2. Implement trip data upload
3. Add user profile management
4. Create trip history/analytics
5. Add data export features
