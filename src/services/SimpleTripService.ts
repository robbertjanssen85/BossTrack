import { simpleSupabaseService, SimpleTrip, SimpleLocation } from './SimpleSupabaseService';
import { simpleAuthService, AuthUser } from './SimpleAuthService';
import { locationService } from './LocationService';

console.log('🚗 SimpleTripService: locationService imported:', {
  exists: !!locationService,
  type: typeof locationService,
  isNull: locationService === null,
  isUndefined: locationService === undefined
});

export interface TripData {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  vehicleId?: string;
  status: 'active' | 'completed' | 'cancelled';
  distanceKm?: number;
  durationSeconds?: number;
  locations: LocationData[];
}

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  bearing?: number;
  speed?: number;
  timestamp: Date;
}

class SimpleTripService {
  private currentTrip: TripData | null = null;
  private locationBuffer: LocationData[] = [];
  private uploadInterval: NodeJS.Timeout | null = null;

  constructor() {
  }

  /**
   * Start a new trip
   */
  async startTrip(vehicleInfo?: { plate: string; type: string }): Promise<TripData> {
    try {
      const user = simpleAuthService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!simpleAuthService.hasValidConsent()) {
        throw new Error('Valid consent required to start trip');
      }

      console.log('🚗 TripService: Starting new trip...');

      // Create trip record
      const tripRecord = await simpleSupabaseService.createTrip({
        userId: user.id,
        startTime: new Date().toISOString(),
        vehicleId: vehicleInfo?.plate,
        status: 'active',
      });

      // Initialize current trip
      this.currentTrip = {
        id: tripRecord.id,
        userId: user.id,
        startTime: new Date(tripRecord.startTime),
        vehicleId: vehicleInfo?.plate,
        status: 'active',
        locations: [],
      };

      // Start location tracking
      await this.startLocationTracking();

      // Start periodic upload
      this.startPeriodicUpload();

      console.log('✅ TripService: Trip started successfully:', this.currentTrip.id);
      return this.currentTrip;

    } catch (error) {
      console.error('❌ TripService: Failed to start trip:', error);
      throw new Error(`Failed to start trip: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop current trip
   */
  async stopTrip(): Promise<TripData | null> {
    try {
      if (!this.currentTrip) {
        console.log('ℹ️ TripService: No active trip to stop');
        return null;
      }

      console.log('🛑 TripService: Stopping trip...');

      // Stop location tracking
      await this.stopLocationTracking();

      // Stop periodic upload
      if (this.uploadInterval) {
        clearInterval(this.uploadInterval);
        this.uploadInterval = null;
      }

      // Upload any remaining locations
      if (this.locationBuffer.length > 0) {
        await this.uploadLocations();
      }

      // Calculate trip statistics
      const endTime = new Date();
      const durationSeconds = Math.floor((endTime.getTime() - this.currentTrip.startTime.getTime()) / 1000);
      const distanceKm = this.calculateTripDistance();

      // Update trip record
      await simpleSupabaseService.updateTrip(this.currentTrip.id, {
        endTime: endTime.toISOString(),
        status: 'completed',
        durationSeconds: durationSeconds,
        distanceKm: distanceKm,
      });

      // Update local trip data
      this.currentTrip.endTime = endTime;
      this.currentTrip.status = 'completed';
      this.currentTrip.durationSeconds = durationSeconds;
      this.currentTrip.distanceKm = distanceKm;

      const completedTrip = { ...this.currentTrip };
      this.currentTrip = null;

      console.log('✅ TripService: Trip stopped successfully:', completedTrip.id);
      return completedTrip;

    } catch (error) {
      console.error('❌ TripService: Failed to stop trip:', error);
      throw new Error(`Failed to stop trip: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current active trip
   */
  getCurrentTrip(): TripData | null {
    return this.currentTrip;
  }

  /**
   * Check if tracking is active
   */
  isTracking(): boolean {
    return this.currentTrip !== null && this.currentTrip.status === 'active';
  }

  /**
   * Get trip history for current user
   */
  async getTripHistory(limit: number = 50): Promise<TripData[]> {
    try {
      const user = simpleAuthService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('📋 TripService: Getting trip history...');

      const trips = await simpleSupabaseService.getUserTrips(user.id, limit);
      
      const tripHistory: TripData[] = [];
      
      for (const trip of trips) {
        const locations = await simpleSupabaseService.getTripLocations(trip.id);
        
        tripHistory.push({
          id: trip.id,
          userId: trip.userId,
          startTime: new Date(trip.startTime),
          endTime: trip.endTime ? new Date(trip.endTime) : undefined,
          vehicleId: trip.vehicleId,
          status: trip.status,
          distanceKm: trip.distanceKm,
          durationSeconds: trip.durationSeconds,
          locations: locations.map(loc => ({
            latitude: loc.latitude,
            longitude: loc.longitude,
            altitude: loc.altitude,
            accuracy: loc.accuracy,
            bearing: loc.bearing,
            speed: loc.speed,
            timestamp: new Date(loc.timestamp),
          })),
        });
      }

      console.log(`✅ TripService: Retrieved ${tripHistory.length} trips`);
      return tripHistory;

    } catch (error) {
      console.error('❌ TripService: Failed to get trip history:', error);
      throw new Error(`Failed to get trip history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start location tracking
   */
  private async startLocationTracking(): Promise<void> {
    try {
      console.log('📍 TripService: Starting location tracking...');
      console.log('🔍 TripService: locationService debug:', {
        exists: !!locationService,
        type: typeof locationService,
        hasRequestMethod: locationService && typeof locationService.requestLocationPermission,
        methods: locationService ? Object.getOwnPropertyNames(Object.getPrototypeOf(locationService)) : 'null'
      });

      // Check if locationService is available
      if (!locationService) {
        console.error('❌ TripService: locationService is null/undefined');
        throw new Error('Location service not available');
      }

      // Check if requestLocationPermission method exists
      if (typeof locationService.requestLocationPermission !== 'function') {
        console.error('❌ TripService: requestLocationPermission method missing');
        console.error('   Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(locationService)));
        throw new Error('Location permission method not available');
      }

      // Request location permission first
      const permissionResult = await locationService.requestLocationPermission();
      if (!permissionResult || permissionResult.status === 'denied' || permissionResult.status === 'restricted') {
        throw new Error(`Location permission denied: ${permissionResult?.status || 'unknown'}`);
      }

      // Start location updates
      await locationService.startTracking();
      
      // Subscribe to location updates
      locationService.subscribeToLocationUpdates(this.handleLocationUpdate.bind(this));
      locationService.subscribeToLocationErrors(this.handleLocationError.bind(this));

      console.log('✅ TripService: Location tracking started');

    } catch (error) {
      console.error('❌ TripService: Failed to start location tracking:', error);
      throw error;
    }
  }

  /**
   * Stop location tracking
   */
  private async stopLocationTracking(): Promise<void> {
    try {
      console.log('⏹️ TripService: Stopping location tracking...');
      
      await locationService.stopTracking();
      locationService.unsubscribeAll();

      console.log('✅ TripService: Location tracking stopped');

    } catch (error) {
      console.error('❌ TripService: Failed to stop location tracking:', error);
    }
  }

  /**
   * Handle location updates from LocationService
   */
  private handleLocationUpdate(location: any): void {
    if (!this.currentTrip) {
      return;
    }

    const locationData: LocationData = {
      latitude: location.latitude,
      longitude: location.longitude,
      altitude: location.altitude,
      accuracy: location.accuracy,
      bearing: location.bearing,
      speed: location.speed,
      timestamp: new Date(location.timestamp),
    };

    // Add to current trip
    this.currentTrip.locations.push(locationData);

    // Add to upload buffer
    this.locationBuffer.push(locationData);

    console.log(`📍 TripService: Location updated (${this.locationBuffer.length} in buffer)`);
  }

  /**
   * Handle location errors
   */
  private handleLocationError(error: any): void {
    console.error('❌ TripService: Location error:', error);
    // Could emit error event or show notification
  }

  /**
   * Start periodic location upload
   */
  private startPeriodicUpload(): void {
    // Upload locations every 30 seconds
    this.uploadInterval = setInterval(async () => {
      if (this.locationBuffer.length > 0) {
        try {
          await this.uploadLocations();
        } catch (error) {
          console.error('❌ TripService: Periodic upload failed:', error);
        }
      }
    }, 30000);

    console.log('⏰ TripService: Periodic upload started (30s interval)');
  }

  /**
   * Upload buffered locations to Supabase
   */
  private async uploadLocations(): Promise<void> {
    if (!this.currentTrip || this.locationBuffer.length === 0) {
      return;
    }

    try {
      console.log(`📤 TripService: Uploading ${this.locationBuffer.length} locations...`);

      const locationRecords: SimpleLocation[] = this.locationBuffer.map(loc => ({
        tripId: this.currentTrip!.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        altitude: loc.altitude,
        accuracy: loc.accuracy,
        bearing: loc.bearing,
        speed: loc.speed,
        timestamp: loc.timestamp.toISOString(),
      }));

      await simpleSupabaseService.addTripLocations(locationRecords);

      // Clear buffer after successful upload
      this.locationBuffer = [];

      console.log('✅ TripService: Locations uploaded successfully');

    } catch (error) {
      console.error('❌ TripService: Failed to upload locations:', error);
      // Keep locations in buffer for retry
      throw error;
    }
  }

  /**
   * Calculate total distance of current trip
   */
  private calculateTripDistance(): number {
    if (!this.currentTrip || this.currentTrip.locations.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    const locations = this.currentTrip.locations;

    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      
      // Haversine formula for distance calculation
      const distance = this.calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
      
      totalDistance += distance;
    }

    return totalDistance;
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton instance
export const simpleTripService = new SimpleTripService();
export default SimpleTripService;
