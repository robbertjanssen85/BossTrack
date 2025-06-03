import { simpleSupabaseService, SimpleUser } from './SimpleSupabaseService';

export interface AuthUser {
  id: string;
  email?: string;
  fullName?: string;
  companyName?: string;
  phone?: string;
  consentGiven: boolean;
  consentTimestamp?: string;
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

class AuthService {
  private currentUser: AuthUser | null = null;

  /**
   * Register a new user with consent data
   */
  async registerWithConsent(consentData: ConsentData): Promise<AuthUser> {
    try {
      console.log('🔐 AuthService: Registering user with consent...');

      // Create a simple email if not provided
      const email = consentData.email || `${Date.now()}@bosstrack.local`;
      const password = this.generateTempPassword();

      // Register user with Supabase
      const authResult = await simpleSupabaseService.signUp(email, password);
      
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

      const createdProfile = await simpleSupabaseService.createUserProfile(profile);

      // Store current user
      this.currentUser = {
        id: createdProfile.id,
        email: createdProfile.email,
        fullName: createdProfile.fullName,
        companyName: createdProfile.companyName,
        phone: createdProfile.phone,
        consentGiven: createdProfile.consentGiven,
        consentTimestamp: createdProfile.consentTimestamp,
      };

      console.log('✅ AuthService: User registered successfully:', this.currentUser.id);
      return this.currentUser;

    } catch (error) {
      console.error('❌ AuthService: Registration failed:', error);
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign in existing user (for future use)
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      console.log('🔐 AuthService: Signing in user...');

      const authUser = await this.supabaseService.signIn(email, password);
      const profile = await this.supabaseService.getUserProfile(authUser.id);

      if (!profile) {
        throw new Error('User profile not found');
      }

      this.currentUser = {
        id: authUser.id,
        email: profile.email,
        fullName: profile.full_name,
        companyName: profile.company_name,
        phone: profile.phone,
        consentGiven: profile.consent_given,
        consentTimestamp: profile.consent_timestamp,
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
      
      await this.supabaseService.signOut();
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

      await this.supabaseService.updateUserProfile(this.currentUser.id, {
        consent_given: consentGiven,
        consent_timestamp: new Date().toISOString(),
      });

      this.currentUser.consentGiven = consentGiven;
      this.currentUser.consentTimestamp = new Date().toISOString();

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

      const authUser = await this.supabaseService.getCurrentUser();
      
      if (!authUser) {
        console.log('ℹ️ AuthService: No stored session found');
        return null;
      }

      const profile = await this.supabaseService.getUserProfile(authUser.id);
      
      if (!profile) {
        console.log('⚠️ AuthService: User profile not found, signing out...');
        await this.supabaseService.signOut();
        return null;
      }

      this.currentUser = {
        id: authUser.id,
        email: profile.email,
        fullName: profile.full_name,
        companyName: profile.company_name,
        phone: profile.phone,
        consentGiven: profile.consent_given,
        consentTimestamp: profile.consent_timestamp,
      };

      console.log('✅ AuthService: Session initialized successfully:', this.currentUser.id);
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
export const authService = new AuthService();
export default AuthService;
