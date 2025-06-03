import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { OTMDataPackage, OTMUploadResponse, OTMUploadRequest, OTMTrip } from '../types/otm5';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string = 'https://api.bosstrack.example.com/v1';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'BossTrack/1.0.0 (iOS)',
      },
    });

    // Request interceptor for authentication and logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.client.defaults.headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove authentication token
  removeAuthToken(): void {
    delete this.client.defaults.headers['Authorization'];
  }

  // Upload trip data in OTM 5.7 format
  async uploadTripData(trips: OTMTrip[], sessionId: string): Promise<OTMUploadResponse> {
    try {
      const dataPackage: OTMDataPackage = this.createDataPackage(trips, sessionId);
      
      const uploadRequest: OTMUploadRequest = {
        data: dataPackage,
        format: 'json',
        compression: 'none',
        encryption: 'none',
        validation: true,
      };

      const response = await this.client.post<OTMUploadResponse>('/trips/upload', uploadRequest);
      return response.data;
    } catch (error) {
      console.error('Failed to upload trip data:', error);
      throw new Error(`Upload failed: ${this.getErrorMessage(error)}`);
    }
  }

  // Upload single trip
  async uploadTrip(trip: OTMTrip, sessionId: string): Promise<OTMUploadResponse> {
    return this.uploadTripData([trip], sessionId);
  }

  // Validate session
  async validateSession(sessionId: string): Promise<{ valid: boolean; expiresAt: string }> {
    try {
      const response = await this.client.get(`/sessions/${sessionId}/validate`);
      return response.data;
    } catch (error) {
      console.error('Failed to validate session:', error);
      throw new Error(`Session validation failed: ${this.getErrorMessage(error)}`);
    }
  }

  // Register device
  async registerDevice(deviceInfo: {
    deviceId: string;
    platform: string;
    appVersion: string;
    sessionId: string;
  }): Promise<{ registered: boolean; deviceToken: string }> {
    try {
      const response = await this.client.post('/devices/register', deviceInfo);
      return response.data;
    } catch (error) {
      console.error('Failed to register device:', error);
      throw new Error(`Device registration failed: ${this.getErrorMessage(error)}`);
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error(`Health check failed: ${this.getErrorMessage(error)}`);
    }
  }

  // Create OTM data package
  private createDataPackage(trips: OTMTrip[], sessionId: string): OTMDataPackage {
    const now = new Date().toISOString();
    const packageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Extract unique vehicles and drivers from trips
    const vehicles = Array.from(
      new Map(
        trips
          .filter(trip => trip.vehicleId)
          .map(trip => [trip.vehicleId, {
            vehicleId: trip.vehicleId,
            licensePlate: '', // Will be filled from vehicle state
            vehicleType: 'van' as const,
          }])
      ).values()
    );

    const drivers = Array.from(
      new Map(
        trips
          .filter(trip => trip.driverId)
          .map(trip => [trip.driverId, {
            driverId: trip.driverId,
            consentTimestamp: now,
            consentSessionId: sessionId,
          }])
      ).values()
    );

    const totalLocations = trips.reduce((sum, trip) => sum + trip.locations.length, 0);
    
    const timeRange = trips.length > 0 ? {
      startTime: trips.reduce((earliest, trip) => 
        trip.startTime < earliest ? trip.startTime : earliest, trips[0].startTime),
      endTime: trips.reduce((latest, trip) => 
        (trip.endTime || trip.startTime) > latest ? (trip.endTime || trip.startTime) : latest, 
        trips[0].endTime || trips[0].startTime),
    } : {
      startTime: now,
      endTime: now,
    };

    return {
      packageId,
      version: '5.7',
      timestamp: now,
      source: {
        application: 'BossTrack',
        version: '1.0.0',
        platform: 'ios',
        device: 'iPhone', // Will be updated with actual device info
      },
      trips,
      vehicles,
      drivers,
      metadata: {
        totalTrips: trips.length,
        totalLocations,
        dataRange: timeRange,
        compressionType: 'none',
        encryptionType: 'none',
      },
    };
  }

  // Extract error message from various error types
  private getErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }

  // Update base URL (for testing or different environments)
  setBaseURL(url: string): void {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  // Get current base URL
  getBaseURL(): string {
    return this.baseURL;
  }
}

export const apiService = new ApiService();
