import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

// Configuration
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
const DEVELOPMENT_MODE = true; // Set to false when you have real Supabase credentials

class SimpleSupabaseService {
  private supabase: SupabaseClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    try {
      // Check if we have real credentials
      if (!DEVELOPMENT_MODE && 
          SUPABASE_URL !== 'https://your-project-ref.supabase.co' && 
          SUPABASE_ANON_KEY !== 'your-anon-key-here') {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        this.isConfigured = true;
        console.log('✅ Supabase client initialized');
      } else {
        console.log('⚠️ Running in MOCK MODE - no real backend connection');
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
    if (error) throw error;
    if (!data.user) throw new Error('No user returned from signUp');
    
    return {
      user: {
        id: data.user.id,
        email: data.user.email || email
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

    // In real implementation, this would insert into user_profiles table
    console.log('📝 Creating user profile (real mode not implemented yet)');
    return profile;
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

    // In real implementation, this would query user_profiles table
    console.log('📝 Getting user profile (real mode not implemented yet)');
    return null;
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

    // In real implementation, this would insert into trips table
    console.log('📝 Creating trip (real mode not implemented yet)');
    throw new Error('Real mode not implemented yet');
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

    // In real implementation, this would update trips table
    console.log('📝 Updating trip (real mode not implemented yet)');
    throw new Error('Real mode not implemented yet');
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
