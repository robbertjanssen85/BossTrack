import { simpleSupabaseService, SimpleUser } from './SimpleSupabaseService';

export interface AuthUser {
  id: string;
  email?: string;
  fullName?: string;
  companyName?: string;
  phone?: string;
  consentGiven: boolean;
  consentTimestamp?: string;
  isAnonymous?: boolean;
}

export interface ConsentData {
  driverName: string;
  licenseNumber?: string;
  vehiclePlate: string;
  vehicleType: 'van' | 'truck' | 'other';
  email?: string;
  companyName?: string;
  phone?: string;
}

class SimpleAuthService {
  private currentUser: AuthUser | null = null;

  /**
   * Register anonymously with consent data (faster for development)
   */
  async registerAnonymouslyWithConsent(consentData: ConsentData): Promise<AuthUser> {
    try {
      console.log('👤 AuthService: Registering anonymous user with consent...');
      console.log('📋 AuthService: Received consent data:', JSON.stringify(consentData, null, 2));

      // Validate consent data
      if (!consentData || typeof consentData !== 'object') {
        throw new Error('Invalid consent data provided');
      }

      if (!consentData.driverName || !consentData.driverName.trim()) {
        throw new Error('Driver name is required');
      }

      if (!consentData.vehiclePlate || !consentData.vehiclePlate.trim()) {
        throw new Error('Vehicle plate is required');
      }

      // Sign in anonymously with Supabase
      const authResult = await simpleSupabaseService.signInAnonymously();
      console.log('✅ AuthService: Anonymous Supabase auth successful:', authResult.user.id);
      
      // Create user profile with consent (anonymous users still get profiles)
      const profile: SimpleUser = {
        id: authResult.user.id,
        email: consentData.email || '', // Optional for anonymous users
        fullName: consentData.driverName,
        companyName: consentData.companyName,
        phone: consentData.phone,
        consentGiven: true,
        consentTimestamp: new Date().toISOString(),
      };

      console.log('🔨 AuthService: Built anonymous profile object:', JSON.stringify(profile, null, 2));

      const createdProfile = await simpleSupabaseService.createUserProfile(profile);
      console.log('✅ AuthService: Anonymous profile creation successful:', createdProfile.id);

      // Store current user
      this.currentUser = {
        id: createdProfile.id,
        email: createdProfile.email,
        fullName: createdProfile.fullName,
        companyName: createdProfile.companyName,
        phone: createdProfile.phone,
        consentGiven: createdProfile.consentGiven,
        consentTimestamp: createdProfile.consentTimestamp,
        isAnonymous: true,
      };

      console.log('✅ AuthService: Anonymous user registered successfully:', this.currentUser.id);
      return this.currentUser;

    } catch (error) {
      console.error('❌ AuthService: Anonymous registration failed:', error);
      
      // Enhanced error handling for common issues
      if (error instanceof Error) {
        if (error.message.includes('User profile already exists')) {
          throw new Error('Account already exists. Please sign in instead of creating a new account.');
        } else if (error.message.includes('Authentication session expired')) {
          throw new Error('Session expired during registration. Please try again.');
        } else if (error.message.includes('Missing required field')) {
          throw new Error('Registration data is incomplete. Please fill out all required fields.');
        } else {
          throw new Error(`Anonymous registration failed: ${error.message}`);
        }
      } else {
        throw new Error('Anonymous registration failed: Unknown error occurred');
      }
    }
  }

  /**
   * Register a new user with consent data (email/password method)
   */
  async registerWithConsent(consentData: ConsentData): Promise<AuthUser> {
    try {
      console.log('🔐 AuthService: Registering user with consent...');
      console.log('📋 AuthService: Received consent data:', JSON.stringify(consentData, null, 2));

      // Validate consent data
      if (!consentData || typeof consentData !== 'object') {
        throw new Error('Invalid consent data provided');
      }

      if (!consentData.driverName || !consentData.driverName.trim()) {
        throw new Error('Driver name is required');
      }

      if (!consentData.vehiclePlate || !consentData.vehiclePlate.trim()) {
        throw new Error('Vehicle plate is required');
      }

      // Create a simple email if not provided
      const email = consentData.email || `driver-${Date.now()}@bosstrack.app`;
      const password = this.generateTempPassword();

      console.log('📧 AuthService: Using email:', email);

      // Register user with Supabase
      const authResult = await simpleSupabaseService.signUp(email, password);
      console.log('✅ AuthService: Supabase auth successful:', authResult.user.id);
      
      // Create user profile with consent
      const profile: SimpleUser = {
        id: authResult.user.id,
        email: email,
        fullName: consentData.driverName,
        companyName: consentData.companyName,
        phone: consentData.phone,
        consentGiven: true,
        consentTimestamp: new Date().toISOString(),
      };

      console.log('🔨 AuthService: Built profile object:', JSON.stringify(profile, null, 2));

      const createdProfile = await simpleSupabaseService.createUserProfile(profile);
      console.log('✅ AuthService: Profile creation successful:', createdProfile.id);

      // Store current user
      this.currentUser = {
        id: createdProfile.id,
        email: createdProfile.email,
        fullName: createdProfile.fullName,
        companyName: createdProfile.companyName,
        phone: createdProfile.phone,
        consentGiven: createdProfile.consentGiven,
        consentTimestamp: createdProfile.consentTimestamp,
        isAnonymous: false,
      };

      console.log('✅ AuthService: User registered successfully:', this.currentUser.id);
      return this.currentUser;

    } catch (error) {
      console.error('❌ AuthService: Registration failed:', error);
      
      // Enhanced error handling for common issues
      if (error instanceof Error) {
        if (error.message.includes('already been registered') || error.message.includes('already registered')) {
          throw new Error(`The email address ${consentData.email || 'provided'} is already registered. Please use a different email address or sign in with your existing account.`);
        } else if (error.message.includes('User profile already exists')) {
          throw new Error('Account already exists. Please sign in instead of creating a new account.');
        } else if (error.message.includes('Authentication session expired')) {
          throw new Error('Session expired during registration. Please try again.');
        } else if (error.message.includes('Missing required field')) {
          throw new Error('Registration data is incomplete. Please fill out all required fields.');
        } else {
          throw new Error(`Registration failed: ${error.message}`);
        }
      } else {
        throw new Error('Registration failed: Unknown error occurred');
      }
    }
  }

  /**
   * Sign in existing user (for future use)
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      console.log('🔐 AuthService: Signing in user...');

      const authResult = await simpleSupabaseService.signIn(email, password);
      const profile = await simpleSupabaseService.getUserProfile(authResult.user.id);

      if (!profile) {
        throw new Error('User profile not found');
      }

      this.currentUser = {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        companyName: profile.companyName,
        phone: profile.phone,
        consentGiven: profile.consentGiven,
        consentTimestamp: profile.consentTimestamp,
      };

      console.log('✅ AuthService: Sign in successful:', this.currentUser.id);
      return this.currentUser;

    } catch (error) {
      console.error('❌ AuthService: Sign in failed:', error);
      throw new Error(`Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      console.log('🚪 AuthService: Signing out user...');
      
      await simpleSupabaseService.signOut();
      this.currentUser = null;

      console.log('✅ AuthService: Sign out successful');

    } catch (error) {
      console.error('❌ AuthService: Sign out failed:', error);
      // Still clear local user even if remote sign out fails
      this.currentUser = null;
      throw new Error(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Update user consent
   */
  async updateConsent(consentGiven: boolean): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      console.log('📝 AuthService: Updating user consent...');

      const updatedProfile = await simpleSupabaseService.updateUserProfile(this.currentUser.id, {
        consentGiven: consentGiven,
        consentTimestamp: new Date().toISOString(),
      });

      this.currentUser.consentGiven = updatedProfile.consentGiven;
      this.currentUser.consentTimestamp = updatedProfile.consentTimestamp;

      console.log('✅ AuthService: Consent updated successfully');

    } catch (error) {
      console.error('❌ AuthService: Consent update failed:', error);
      throw new Error(`Consent update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if user has valid consent (within 24 hours)
   */
  hasValidConsent(): boolean {
    if (!this.currentUser || !this.currentUser.consentGiven || !this.currentUser.consentTimestamp) {
      return false;
    }

    const consentTime = new Date(this.currentUser.consentTimestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - consentTime.getTime()) / (1000 * 60 * 60);

    return hoursDiff < 24; // Consent valid for 24 hours
  }

  /**
   * Initialize session from stored auth state
   */
  async initializeSession(): Promise<AuthUser | null> {
    try {
      console.log('🔄 AuthService: Initializing session...');

      const authUser = await simpleSupabaseService.getCurrentUser();
      
      if (!authUser) {
        console.log('ℹ️ AuthService: No stored session found');
        return null;
      }

      const profile = await simpleSupabaseService.getUserProfile(authUser.id);
      
      if (!profile) {
        console.log('⚠️ AuthService: User profile not found, signing out...');
        await simpleSupabaseService.signOut();
        return null;
      }

      // Determine if user is anonymous (no email or generated email pattern)
      const isAnonymous = !authUser.email || authUser.email === '' || authUser.email.includes('anonymous');

      this.currentUser = {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        companyName: profile.companyName,
        phone: profile.phone,
        consentGiven: profile.consentGiven,
        consentTimestamp: profile.consentTimestamp,
        isAnonymous: isAnonymous,
      };

      console.log('✅ AuthService: Session initialized successfully:', this.currentUser.id, isAnonymous ? '(anonymous)' : '(email/password)');
      return this.currentUser;

    } catch (error) {
      console.error('❌ AuthService: Session initialization failed:', error);
      this.currentUser = null;
      return null;
    }
  }

  /**
   * Generate a temporary password for anonymous users
   */
  private generateTempPassword(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const simpleAuthService = new SimpleAuthService();
export default SimpleAuthService;
