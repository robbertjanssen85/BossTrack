import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OTMLocation, OTMTrip, OTMVehicle, OTMDriver } from '../types/otm5';

// Supabase configuration
// Note: In React Native, you typically don't use process.env directly
// Instead, you would use a config file or react-native-config
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

// Development mode - set to true to use mock services
const DEVELOPMENT_MODE = true;

// Database table interfaces
interface TripRecord {
  id?: string;
  user_id: string;
  trip_id: string;
  start_time: string;
  end_time?: string;
  vehicle_id?: string;
  driver_id?: string;
  status: 'active' | 'completed' | 'cancelled';
  distance_km?: number;
  duration_seconds?: number;
  created_at?: string;
  updated_at?: string;
}

interface LocationRecord {
  id?: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  bearing?: number;
  speed?: number;
  timestamp: string;
  created_at?: string;
}

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  company_name?: string;
  phone?: string;
  consent_given: boolean;
  consent_timestamp?: string;
  created_at?: string;
  updated_at?: string;
}

class SupabaseService {
  private supabase: SupabaseClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    try {
      // In development mode or if not configured, use mock mode
      if (DEVELOPMENT_MODE || SUPABASE_URL === 'https://your-project-ref.supabase.co' || SUPABASE_ANON_KEY === 'your-anon-key-here') {
        console.log('⚠️ Supabase running in MOCK MODE - no real backend connection');
        this.isConfigured = false;
        this.supabase = null;
      } else {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.isConfigured = true;
        console.log('✅ Supabase client initialized');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Supabase:', error);
      this.isConfigured = false;
      this.supabase = null;
    }
  }

  // Check if Supabase is properly configured
  isSupabaseConfigured(): boolean {
    return this.isConfigured;
  }

  // Authentication methods
  async signUp(email: string, password: string, userData?: { fullName?: string; companyName?: string; phone?: string }) {
    // Mock mode implementation
    if (!this.isConfigured) {
      console.log('🔐 Mock signUp:', email);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      
      return {
        user: {
          id: `mock_user_${Date.now()}`,
          email,
          user_metadata: {
            full_name: userData?.fullName,
            company_name: userData?.companyName,
            phone: userData?.phone
          }
        },
        session: {
          access_token: 'mock_token',
          refresh_token: 'mock_refresh_token'
        }
      };
    }

    try {
      const { data, error } = await this.supabase!.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData?.fullName,
            company_name: userData?.companyName,
            phone: userData?.phone
          }
        }
      });

      if (error) throw error;

      console.log('✅ User signed up successfully:', data.user?.email);
      return data;
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    // Mock mode implementation
    if (!this.isConfigured) {
      console.log('🔐 Mock signIn:', email);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
      
      return {
        user: {
          id: `mock_user_${email.replace('@', '_').replace('.', '_')}`,
          email
        },
        session: {
          access_token: 'mock_token',
          refresh_token: 'mock_refresh_token'
        }
      };
    }

    try {
      const { data, error } = await this.supabase!.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      console.log('✅ User signed in successfully:', data.user?.email);
      return data;
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      throw error;
    }
  }

  async signOut() {
    // Mock mode implementation
    if (!this.isConfigured) {
      console.log('🚪 Mock signOut');
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
      return { error: null };
    }

    try {
      const { error } = await this.supabase!.auth.signOut();
      if (error) throw error;

      console.log('✅ User signed out successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    // Mock mode implementation
    if (!this.isConfigured) {
      console.log('👤 Mock getCurrentUser: No stored session');
      return null; // No session in mock mode
    }

    try {
      const { data: { user } } = await this.supabase!.auth.getUser();
      return user;
    } catch (error) {
      console.error('❌ Get current user failed:', error);
      return null;
    }
  }

  // User profile methods
  async createUserProfile(userId: string, profileData: Partial<UserProfile>) {
    if (!this.isConfigured) {
      console.log('🎭 Mock: Creating user profile for', userId);
      return { data: { id: userId, ...profileData }, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert([
          {
            id: userId,
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ User profile created:', data.id);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Create user profile failed:', error);
      return { data: null, error };
    }
  }

  async getUserProfile(userId: string) {
    if (!this.isConfigured) {
      console.log('🎭 Mock: Getting user profile for', userId);
      return { 
        data: { 
          id: userId, 
          email: 'demo@example.com', 
          full_name: 'Demo User',
          consent_given: true,
          consent_timestamp: new Date().toISOString()
        }, 
        error: null 
      };
    }

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('❌ Get user profile failed:', error);
      return { data: null, error };
    }
  }

  // Trip management methods
  async createTrip(tripData: Omit<TripRecord, 'id' | 'created_at' | 'updated_at'>) {
    if (!this.isConfigured) {
      const mockTrip = { 
        id: `mock-trip-${Date.now()}`, 
        ...tripData, 
        created_at: new Date().toISOString() 
      };
      console.log('🎭 Mock: Creating trip', mockTrip.id);
      return { data: mockTrip, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('trips')
        .insert([
          {
            ...tripData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Trip created:', data.trip_id);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Create trip failed:', error);
      return { data: null, error };
    }
  }

  async updateTrip(tripId: string, updates: Partial<TripRecord>) {
    if (!this.isConfigured) {
      console.log('🎭 Mock: Updating trip', tripId, updates);
      return { data: { id: tripId, ...updates }, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('trips')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('trip_id', tripId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Trip updated:', data.trip_id);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Update trip failed:', error);
      return { data: null, error };
    }
  }

  // Location data methods
  async saveLocationData(tripId: string, locations: OTMLocation[]) {
    if (!this.isConfigured) {
      console.log(`🎭 Mock: Saving ${locations.length} locations for trip ${tripId}`);
      return { data: locations.map((loc, i) => ({ id: `mock-${i}`, trip_id: tripId, ...loc })), error: null };
    }

    try {
      const locationRecords: Omit<LocationRecord, 'id' | 'created_at'>[] = locations.map(location => ({
        trip_id: tripId,
        latitude: location.latitude,
        longitude: location.longitude,
        altitude: location.altitude,
        accuracy: location.accuracy,
        bearing: location.bearing,
        speed: location.speed,
        timestamp: location.timestamp
      }));

      const { data, error } = await this.supabase
        .from('location_data')
        .insert(locationRecords)
        .select();

      if (error) throw error;

      console.log(`✅ Saved ${data.length} location points for trip ${tripId}`);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Save location data failed:', error);
      return { data: null, error };
    }
  }

  async getTripLocations(tripId: string) {
    if (!this.isConfigured) {
      console.log('🎭 Mock: Getting locations for trip', tripId);
      return { 
        data: [
          {
            id: '1',
            trip_id: tripId,
            latitude: 37.7749,
            longitude: -122.4194,
            timestamp: new Date().toISOString()
          }
        ], 
        error: null 
      };
    }

    try {
      const { data, error } = await this.supabase
        .from('location_data')
        .select('*')
        .eq('trip_id', tripId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('❌ Get trip locations failed:', error);
      return { data: null, error };
    }
  }

  // Trip history methods
  async getUserTrips(userId: string, limit: number = 50) {
    if (!this.isConfigured) {
      console.log('🎭 Mock: Getting trips for user', userId);
      return { 
        data: [
          {
            id: '1',
            user_id: userId,
            trip_id: 'trip-001',
            start_time: new Date(Date.now() - 86400000).toISOString(),
            end_time: new Date(Date.now() - 83400000).toISOString(),
            status: 'completed' as const,
            distance_km: 15.5,
            duration_seconds: 3600
          }
        ], 
        error: null 
      };
    }

    try {
      const { data, error } = await this.supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('❌ Get user trips failed:', error);
      return { data: null, error };
    }
  }

  // Consent management
  async updateUserConsent(userId: string, consentGiven: boolean) {
    if (!this.isConfigured) {
      console.log('🎭 Mock: Updating consent for user', userId, consentGiven);
      return { data: { consent_given: consentGiven }, error: null };
    }

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update({
          consent_given: consentGiven,
          consent_timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ User consent updated: ${consentGiven ? 'granted' : 'revoked'}`);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Update user consent failed:', error);
      return { data: null, error };
    }
  }

  // Utility methods
  generateTripId(): string {
    return `trip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Real-time subscriptions (for future use)
  subscribeToTripUpdates(tripId: string, callback: (payload: any) => void) {
    if (!this.isConfigured) {
      console.log('🎭 Mock: Subscribing to trip updates for', tripId);
      return () => {}; // Return empty unsubscribe function
    }

    const subscription = this.supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `trip_id=eq.${tripId}`
        },
        callback
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }
}

export const supabaseService = new SupabaseService();
export type { TripRecord, LocationRecord, UserProfile };
