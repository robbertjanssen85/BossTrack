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
      console.warn('LocationTracker native module not available');
      return { status: 'module_not_available' };
    }
    
    try {
      const result = await LocationTracker.startTracking();
      return result;
    } catch (error) {
      throw new Error(`Failed to start tracking: ${error}`);
    }
  }

  // Stop location tracking
  async stopTracking(): Promise<{ status: string }> {
    if (Platform.OS !== 'ios') {
      throw new Error('Location tracking is currently only supported on iOS');
    }
    
    if (!LocationTracker) {
      console.warn('LocationTracker native module not available');
      return { status: 'module_not_available' };
    }
    
    try {
      const result = await LocationTracker.stopTracking();
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
    
    try {
      const result = await LocationTracker.requestLocationPermission();
      return result;
    } catch (error) {
      throw new Error(`Failed to request permission: ${error}`);
    }
  }

  // Get current location permission status
  async getLocationPermissionStatus(): Promise<{ status: string }> {
    if (Platform.OS !== 'ios') {
      return { status: 'not_supported' };
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
    
    try {
      const location = await LocationTracker.getCurrentLocation();
      return this.formatLocationData(location);
    } catch (error) {
      throw new Error(`Failed to get current location: ${error}`);
    }
  }

  // Subscribe to location updates
  subscribeToLocationUpdates(callback: (location: OTMLocation) => void): void {
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
}

export const locationService = new LocationService();
