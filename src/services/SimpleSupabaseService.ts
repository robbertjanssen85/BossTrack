import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Config } from '../config/environment';

// Simple interfaces for our app
export interface SimpleUser {
  id: string;
  email?: string;
  fullName?: string;
  companyName?: string;
  phone?: string;
  consentGiven: boolean;
  consentTimestamp?: string;
}

export interface SimpleTrip {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  vehicleId?: string;
  status: 'active' | 'completed' | 'cancelled';
  distanceKm?: number;
  durationSeconds?: number;
}

export interface SimpleLocation {
  tripId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  bearing?: number;
  speed?: number;
  timestamp: string;
}

// Configuration - Using real credentials from Config
const SUPABASE_URL = Config.SUPABASE_URL;
const SUPABASE_ANON_KEY = Config.SUPABASE_ANON_KEY;
const DEVELOPMENT_MODE = Config.DEVELOPMENT_MODE;

class SimpleSupabaseService {
  private supabase: SupabaseClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    try {
      // Check if we have real credentials and are not in development mode
      if (!DEVELOPMENT_MODE && SUPABASE_URL && SUPABASE_ANON_KEY) {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.isConfigured = true;
        console.log('✅ Supabase client initialized with real credentials');
        console.log('🔗 Connected to:', SUPABASE_URL);
      } else {
        console.log('⚠️ Running in MOCK MODE - no real backend connection');
        console.log('   DEVELOPMENT_MODE:', DEVELOPMENT_MODE);
        console.log('   Has URL:', !!SUPABASE_URL);
        console.log('   Has Key:', !!SUPABASE_ANON_KEY);
        this.isConfigured = false;
      }
    } catch (error) {
      console.error('❌ Failed to initialize Supabase:', error);
      this.isConfigured = false;
    }
  }

  // Authentication
  async signUp(email: string, password: string): Promise<{ user: { id: string; email: string } }> {
    if (!this.isConfigured) {
      console.log('🔐 Mock signUp:', email);
      await this.mockDelay(500);
      return {
        user: {
          id: `mock_user_${Date.now()}`,
          email
        }
      };
    }

    const { data, error } = await this.supabase!.auth.signUp({ email, password });
    
    if (error) {
      // Handle specific error cases
      if (error.message?.includes('already been registered') || error.message?.includes('User already registered')) {
        console.log('📧 Email already registered, attempting to sign in instead...');
        // If user already exists, try to sign them in
        try {
          const signInResult = await this.signIn(email, password);
          return signInResult;
        } catch (signInError) {
          throw new Error(`Email ${email} is already registered. Please use a different email or sign in with your existing account.`);
        }
      }
      throw error;
    }
    
    if (!data.user) throw new Error('No user returned from signUp');
    
    return {
      user: {
        id: data.user.id,
        email: data.user.email || email
      }
    };
  }

  async signInAnonymously(): Promise<{ user: { id: string; email: string; isAnonymous: boolean } }> {
    if (!this.isConfigured) {
      console.log('👤 Mock signInAnonymously');
      await this.mockDelay(300);
      return {
        user: {
          id: `mock_anon_${Date.now()}`,
          email: '',
          isAnonymous: true
        }
      };
    }

    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }

    console.log('👤 Signing in anonymously...');
    const { data, error } = await this.supabase.auth.signInAnonymously();

    if (error) {
      console.error('❌ Anonymous sign-in failed:', error);
      throw error;
    }
    
    if (!data.user) {
      throw new Error('Failed to create anonymous user');
    }

    console.log('✅ Anonymous sign-in successful:', data.user.id);
    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        isAnonymous: data.user.is_anonymous || true
      }
    };
  }

  async signIn(email: string, password: string): Promise<{ user: { id: string; email: string } }> {
    if (!this.isConfigured) {
      console.log('🔐 Mock signIn:', email);
      await this.mockDelay(500);
      return {
        user: {
          id: `mock_user_${email.replace('@', '_').replace('.', '_')}`,
          email
        }
      };
    }

    const { data, error } = await this.supabase!.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('No user returned from signIn');
    
    return {
      user: {
        id: data.user.id,
        email: data.user.email || email
      }
    };
  }

  async signOut(): Promise<void> {
    if (!this.isConfigured) {
      console.log('🚪 Mock signOut');
      await this.mockDelay(300);
      return;
    }

    const { error } = await this.supabase!.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<{ id: string; email: string } | null> {
    if (!this.isConfigured) {
      console.log('👤 Mock getCurrentUser: No session');
      return null;
    }

    const { data: { user } } = await this.supabase!.auth.getUser();
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email || ''
    };
  }

  // User Profile Management
  async createUserProfile(profile: SimpleUser): Promise<SimpleUser> {
    if (!this.isConfigured) {
      console.log('👤 Mock createUserProfile:', profile.id);
      await this.mockDelay(300);
      return {
        ...profile,
        consentTimestamp: new Date().toISOString()
      };
    }

    try {
      console.log('📝 Creating user profile with Supabase...');
      console.log('📋 Profile data:', JSON.stringify(profile, null, 2));
      
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Validate required fields
      if (!profile.id) {
        throw new Error('User ID is required for profile creation');
      }

      // Clean up profile data - remove undefined values and ensure proper types
      const cleanProfile = {
        id: profile.id,
        email: profile.email || null, // Convert empty string or undefined to null
        full_name: profile.fullName || null, // Convert empty string or undefined to null
        company_name: profile.companyName || null, // Convert empty string or undefined to null
        phone: profile.phone || null, // Convert empty string or undefined to null
        consent_given: Boolean(profile.consentGiven), // Ensure boolean
        consent_timestamp: profile.consentTimestamp || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🧹 Clean profile data:', JSON.stringify(cleanProfile, null, 2));

      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert([cleanProfile])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase createUserProfile error:', error);
        
        // Provide specific error messages for common issues
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('User profile already exists for this user ID');
        } else if (error.code === '23502') { // Not null constraint violation
          throw new Error(`Missing required field: ${error.details || 'unknown field'}`);
        } else if (error.message?.includes('JWT')) {
          throw new Error('Authentication session expired. Please sign in again.');
        } else {
          throw new Error(`Failed to create user profile: ${error.message || 'Unknown database error'}`);
        }
      }

      console.log('✅ User profile created successfully:', data?.id || 'unknown');
      console.log('📄 Raw database response:', JSON.stringify(data, null, 2));
      
      // Check if we got valid data back
      if (!data) {
        throw new Error('No data returned from database insert');
      }
      
      // Convert back to SimpleUser format with safe fallbacks
      const result: SimpleUser = {
        id: data.id || profile.id, // fallback to original ID
        email: data.email || profile.email || '',
        fullName: data.full_name || profile.fullName || '',
        companyName: data.company_name || profile.companyName || '',
        phone: data.phone || profile.phone || '',
        consentGiven: data.consent_given !== undefined ? data.consent_given : profile.consentGiven,
        consentTimestamp: data.consent_timestamp || profile.consentTimestamp || new Date().toISOString()
      };
      
      console.log('🔄 Converted result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('❌ Failed to create user profile:', error);
      
      // Enhanced error logging
      if (error instanceof Error) {
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
      }
      
      // Log the original profile data for debugging
      console.error('   Original profile data:', JSON.stringify(profile, null, 2));
      
      // Check if it's a Supabase error
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('   Supabase error code:', (error as any).code);
        console.error('   Supabase error details:', (error as any).details);
        console.error('   Supabase error hint:', (error as any).hint);
      }
      
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<SimpleUser | null> {
    if (!this.isConfigured) {
      console.log('👤 Mock getUserProfile:', userId);
      await this.mockDelay(200);
      return {
        id: userId,
        email: `${userId}@bosstrack.local`,
        fullName: 'Mock User',
        companyName: 'Mock Company',
        phone: '+1-555-0123',
        consentGiven: true,
        consentTimestamp: new Date().toISOString()
      };
    }

    try {
      console.log('📝 Getting user profile with Supabase...');
      
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          console.log('📝 User profile not found:', userId);
          return null;
        }
        console.error('❌ Supabase getUserProfile error:', error);
        throw new Error(`Failed to get user profile: ${error.message}`);
      }

      console.log('✅ User profile retrieved successfully:', data.id);
      
      // Convert from database format to SimpleUser format
      const result: SimpleUser = {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        companyName: data.company_name,
        phone: data.phone,
        consentGiven: data.consent_given,
        consentTimestamp: data.consent_timestamp
      };
      
      return result;
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<SimpleUser>): Promise<SimpleUser> {
    if (!this.isConfigured) {
      console.log('👤 Mock updateUserProfile:', userId, updates);
      await this.mockDelay(300);
      return {
        id: userId,
        email: `${userId}@bosstrack.local`,
        fullName: 'Mock User',
        companyName: 'Mock Company',
        phone: '+1-555-0123',
        consentGiven: true,
        consentTimestamp: new Date().toISOString(),
        ...updates
      };
    }

    // In real implementation, this would update user_profiles table
    console.log('📝 Updating user profile (real mode not implemented yet)');
    throw new Error('Real mode not implemented yet');
  }

  // Trip Management
  async createTrip(trip: Omit<SimpleTrip, 'id'>): Promise<SimpleTrip> {
    if (!this.isConfigured) {
      console.log('🚗 Mock createTrip');
      await this.mockDelay(300);
      return {
        id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...trip
      };
    }

    try {
      console.log('📝 Creating trip with Supabase...');
      
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await this.supabase
        .from('trips')
        .insert([trip])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase createTrip error:', error);
        throw new Error(`Failed to create trip: ${error.message}`);
      }

      console.log('✅ Trip created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Failed to create trip:', error);
      throw error;
    }
  }

  async updateTrip(tripId: string, updates: Partial<SimpleTrip>): Promise<SimpleTrip> {
    if (!this.isConfigured) {
      console.log('🚗 Mock updateTrip:', tripId);
      await this.mockDelay(300);
      return {
        id: tripId,
        userId: 'mock_user',
        startTime: new Date().toISOString(),
        status: 'completed',
        ...updates
      };
    }

    try {
      console.log('📝 Updating trip with Supabase...');
      
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await this.supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase updateTrip error:', error);
        throw new Error(`Failed to update trip: ${error.message}`);
      }

      console.log('✅ Trip updated successfully:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Failed to update trip:', error);
      throw error;
    }
  }

  async getUserTrips(userId: string, limit: number = 50): Promise<SimpleTrip[]> {
    if (!this.isConfigured) {
      console.log('🚗 Mock getUserTrips:', userId);
      await this.mockDelay(400);
      return [
        {
          id: 'trip_001',
          userId,
          startTime: new Date(Date.now() - 86400000).toISOString(),
          endTime: new Date(Date.now() - 82800000).toISOString(),
          status: 'completed',
          distanceKm: 15.5,
          durationSeconds: 3600
        }
      ];
    }

    // In real implementation, this would query trips table
    console.log('📝 Getting user trips (real mode not implemented yet)');
    return [];
  }

  // Location Data
  async addTripLocations(locations: SimpleLocation[]): Promise<void> {
    if (!this.isConfigured) {
      console.log(`📍 Mock addTripLocations: ${locations.length} locations`);
      await this.mockDelay(200);
      return;
    }

    // In real implementation, this would insert into location_data table
    console.log('📝 Adding trip locations (real mode not implemented yet)');
  }

  async getTripLocations(tripId: string): Promise<SimpleLocation[]> {
    if (!this.isConfigured) {
      console.log('📍 Mock getTripLocations:', tripId);
      await this.mockDelay(300);
      return [
        {
          tripId,
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: 10,
          accuracy: 5,
          bearing: 90,
          speed: 25,
          timestamp: new Date().toISOString()
        }
      ];
    }

    // In real implementation, this would query location_data table
    console.log('📝 Getting trip locations (real mode not implemented yet)');
    return [];
  }

  // Utility
  isSupabaseConfigured(): boolean {
    return this.isConfigured;
  }

  private async mockDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const simpleSupabaseService = new SimpleSupabaseService();
export default SimpleSupabaseService;
