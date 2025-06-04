import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { OTMLocation } from '../types/otm5';
import { LocationUpdateEvent, LocationErrorEvent, AuthorizationChangedEvent } from '../types/app';

interface LocationTrackerModule {
  startTracking(): Promise<{ status: string; frequency?: string }>;
  stopTracking(): Promise<{ status: string }>;
  requestLocationPermission(): Promise<{ status: string }>;
  getLocationPermissionStatus(): Promise<{ status: string }>;
  getCurrentLocation(): Promise<OTMLocation>;
}

const { LocationTracker } = NativeModules as { LocationTracker: LocationTrackerModule };

class LocationService {
  private eventEmitter: NativeEventEmitter | null = null;
  private locationUpdateListener: any = null;
  private locationErrorListener: any = null;
  private authorizationListener: any = null;

  constructor() {
    console.log('📍 LocationService: Initializing...');
    console.log('📍 LocationService: Platform:', Platform.OS);
    console.log('📍 LocationService: LocationTracker available:', !!LocationTracker);
    
    // Temporarily disabled to prevent initialization errors
    // Only initialize event emitter if the native module is available
    // if (LocationTracker && Platform.OS === 'ios') {
    //   this.eventEmitter = new NativeEventEmitter(LocationTracker as any);
    // }
  }

  private getEventEmitter(): NativeEventEmitter {
    if (!this.eventEmitter) {
      if (!LocationTracker) {
        throw new Error('LocationTracker native module is not available');
      }
      this.eventEmitter = new NativeEventEmitter(LocationTracker as any);
    }
    return this.eventEmitter;
  }

  // Start location tracking at 1Hz
  async startTracking(): Promise<{ status: string; frequency?: string }> {
    if (Platform.OS !== 'ios') {
      throw new Error('Location tracking is currently only supported on iOS');
    }
    
    if (!LocationTracker) {
      console.warn('LocationTracker native module not available, simulating location tracking');
      
      // Start mock location updates for development
      this.startMockLocationUpdates();
      
      return { status: 'started', frequency: 'mock' };
    }
    
    try {
      const result = await LocationTracker.startTracking();
      return result;
    } catch (error) {
      console.error('LocationTracker start failed:', error);
      throw new Error(`Failed to start tracking: ${error}`);
    }
  }

  // Stop location tracking
  async stopTracking(): Promise<{ status: string }> {
    if (Platform.OS !== 'ios') {
      throw new Error('Location tracking is currently only supported on iOS');
    }
    
    if (!LocationTracker) {
      console.warn('LocationTracker native module not available, stopping mock updates');
      this.stopMockLocationUpdates();
      return { status: 'stopped' };
    }
    
    try {
      const result = await LocationTracker.stopTracking();
      this.stopMockLocationUpdates(); // Also stop any mock updates
      return result;
    } catch (error) {
      throw new Error(`Failed to stop tracking: ${error}`);
    }
  }

  // Request location permission
  async requestLocationPermission(): Promise<{ status: string }> {
    if (Platform.OS !== 'ios') {
      throw new Error('Location permission is currently only supported on iOS');
    }
    
    if (!LocationTracker) {
      console.warn('LocationTracker native module not available, returning mock permission');
      return { status: 'granted' }; // Mock success for development
    }
    
    try {
      const result = await LocationTracker.requestLocationPermission();
      return result;
    } catch (error) {
      console.error('LocationTracker permission request failed:', error);
      throw new Error(`Failed to request permission: ${error}`);
    }
  }

  // Get current location permission status
  async getLocationPermissionStatus(): Promise<{ status: string }> {
    if (Platform.OS !== 'ios') {
      return { status: 'not_supported' };
    }
    
    if (!LocationTracker) {
      console.log('📍 Returning mock permission status');
      return { status: 'granted' };
    }
    
    try {
      const result = await LocationTracker.getLocationPermissionStatus();
      return result;
    } catch (error) {
      throw new Error(`Failed to get permission status: ${error}`);
    }
  }

  // Get current location
  async getCurrentLocation(): Promise<OTMLocation> {
    if (Platform.OS !== 'ios') {
      throw new Error('Location services are currently only supported on iOS');
    }
    
    if (!LocationTracker) {
      // Return mock location for development
      console.log('📍 Returning mock current location');
      return {
        latitude: 37.7749 + (Math.random() - 0.5) * 0.001,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.001,
        altitude: 50 + (Math.random() - 0.5) * 20,
        accuracy: 5 + Math.random() * 5,
        bearing: Math.random() * 360,
        speed: Math.random() * 10,
        timestamp: new Date().toISOString(),
      };
    }
    
    try {
      const location = await LocationTracker.getCurrentLocation();
      return this.formatLocationData(location);
    } catch (error) {
      throw new Error(`Failed to get current location: ${error}`);
    }
  }

  // Subscribe to location updates
  subscribeToLocationUpdates(callback: (location: OTMLocation) => void): void {
    if (!LocationTracker) {
      // In mock mode, store the callback directly
      (this as any).mockLocationCallback = callback;
      console.log('📍 Subscribed to mock location updates');
      return;
    }
    
    const emitter = this.getEventEmitter();
    this.locationUpdateListener = emitter.addListener(
      'LocationUpdate',
      (event: LocationUpdateEvent) => {
        const location = this.formatLocationData(event);
        callback(location);
      }
    );
  }

  // Subscribe to location errors
  subscribeToLocationErrors(callback: (error: string) => void): void {
    if (!LocationTracker) {
      // In mock mode, store the error callback (though we don't simulate errors)
      (this as any).mockErrorCallback = callback;
      console.log('📍 Subscribed to mock location errors');
      return;
    }
    
    const emitter = this.getEventEmitter();
    this.locationErrorListener = emitter.addListener(
      'LocationError',
      (event: LocationErrorEvent) => {
        callback(event.error);
      }
    );
  }

  // Subscribe to authorization changes
  subscribeToAuthorizationChanges(callback: (status: string) => void): void {
    if (!LocationTracker) {
      // In mock mode, store the auth callback
      (this as any).mockAuthCallback = callback;
      console.log('📍 Subscribed to mock authorization changes');
      // Immediately report "granted" status in mock mode
      setTimeout(() => callback('granted'), 100);
      return;
    }
    
    const emitter = this.getEventEmitter();
    this.authorizationListener = emitter.addListener(
      'AuthorizationChanged',
      (event: AuthorizationChangedEvent) => {
        callback(event.status);
      }
    );
  }

  // Unsubscribe from all listeners
  unsubscribeAll(): void {
    // Clean up native listeners
    if (this.locationUpdateListener) {
      this.locationUpdateListener.remove();
      this.locationUpdateListener = null;
    }
    
    if (this.locationErrorListener) {
      this.locationErrorListener.remove();
      this.locationErrorListener = null;
    }
    
    if (this.authorizationListener) {
      this.authorizationListener.remove();
      this.authorizationListener = null;
    }
    
    // Clean up mock callbacks
    (this as any).mockLocationCallback = null;
    (this as any).mockErrorCallback = null;
    (this as any).mockAuthCallback = null;
    
    // Stop mock updates
    this.stopMockLocationUpdates();
  }

  // Check if location services are available
  isLocationServiceAvailable(): boolean {
    return Platform.OS === 'ios' && LocationTracker != null;
  }

  // Format location data to OTM format
  private formatLocationData(data: any): OTMLocation {
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude,
      accuracy: data.accuracy,
      bearing: data.bearing,
      speed: data.speed,
      timestamp: data.timestamp || new Date().toISOString(),
    };
  }

  // Start mock location updates for development
  private startMockLocationUpdates(): void {
    console.log('📍 Starting mock location updates for development');
    
    // Mock location around San Francisco
    let latitude = 37.7749;
    let longitude = -122.4194;
    let speed = 0;
    let bearing = 0;
    
    const mockInterval = setInterval(() => {
      // Simulate slight movement
      latitude += (Math.random() - 0.5) * 0.001;
      longitude += (Math.random() - 0.5) * 0.001;
      speed = Math.random() * 30; // 0-30 m/s
      bearing = (bearing + Math.random() * 10 - 5) % 360;
      
      const mockLocation: OTMLocation = {
        latitude,
        longitude,
        altitude: 50 + (Math.random() - 0.5) * 20,
        accuracy: 5 + Math.random() * 10,
        bearing,
        speed,
        timestamp: new Date().toISOString(),
      };
      
      // Trigger location update callbacks directly
      this.triggerMockLocationUpdate(mockLocation);
    }, 1000); // 1Hz updates
    
    // Store interval for cleanup
    (this as any).mockInterval = mockInterval;
  }

  // Trigger mock location update to any registered callbacks
  private triggerMockLocationUpdate(location: OTMLocation): void {
    // For mock mode, we need to store callbacks and call them directly
    if ((this as any).mockLocationCallback) {
      (this as any).mockLocationCallback(location);
    }
  }

  // Stop mock location updates
  private stopMockLocationUpdates(): void {
    if ((this as any).mockInterval) {
      clearInterval((this as any).mockInterval);
      (this as any).mockInterval = null;
      console.log('📍 Stopped mock location updates');
    }
  }
}

console.log('📍 LocationService: Creating singleton instance...');
export const locationService = new LocationService();
console.log('📍 LocationService: Singleton created successfully:', !!locationService);
