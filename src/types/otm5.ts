/**
 * OTM 5.7 Compatible TypeScript Interfaces for BossTrack
 * Based on Open Travel Model 5.7 specification for transportation data
 */

export interface OTMLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  bearing?: number;
  speed?: number;
  timestamp: string; // ISO 8601 format
}

export interface OTMVehicle {
  vehicleId: string;
  licensePlate: string;
  vehicleType: 'van' | 'truck' | 'other';
  make?: string;
  model?: string;
  year?: number;
  capacity?: {
    weight?: number;
    volume?: number;
  };
}

export interface OTMDriver {
  driverId: string;
  name?: string;
  licenseNumber?: string;
  consentTimestamp: string;
  consentSessionId: string;
}

export interface OTMTrip {
  tripId: string;
  sessionId: string;
  vehicleId: string;
  driverId: string;
  startTime: string;
  endTime?: string;
  origin?: OTMLocation;
  destination?: OTMLocation;
  status: 'active' | 'completed' | 'cancelled';
  missionProfile?: OTMMissionProfile;
  locations: OTMLocation[];
  metadata: {
    appVersion: string;
    deviceId: string;
    platform: 'ios' | 'android';
    samplingRate: number; // in Hz
    dataQuality: 'high' | 'medium' | 'low';
  };
}

export interface OTMMissionProfile {
  missionId: string;
  missionType: 'delivery' | 'pickup' | 'transport' | 'patrol' | 'service' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description?: string;
  estimatedDuration?: number; // in minutes
  cargo?: {
    type: string;
    weight?: number;
    volume?: number;
    value?: number;
    hazardous?: boolean;
  };
  route?: {
    waypoints: OTMLocation[];
    estimatedDistance?: number; // in kilometers
  };
}

export interface OTMDataPackage {
  packageId: string;
  version: '5.7';
  timestamp: string;
  source: {
    application: 'BossTrack';
    version: string;
    platform: 'ios' | 'android';
    device: string;
  };
  trips: OTMTrip[];
  vehicles: OTMVehicle[];
  drivers: OTMDriver[];
  metadata: {
    totalTrips: number;
    totalLocations: number;
    dataRange: {
      startTime: string;
      endTime: string;
    };
    compressionType?: 'gzip' | 'none';
    encryptionType?: 'aes256' | 'none';
  };
}

export interface OTMUploadResponse {
  success: boolean;
  packageId: string;
  uploadId: string;
  timestamp: string;
  status: 'received' | 'processing' | 'validated' | 'stored' | 'failed';
  errors?: string[];
  warnings?: string[];
  statistics?: {
    tripsProcessed: number;
    locationsProcessed: number;
    dataQualityScore: number;
  };
}

export interface OTMError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Utility types for API requests
export interface OTMUploadRequest {
  data: OTMDataPackage;
  format: 'json' | 'xml';
  compression?: 'gzip' | 'none';
  encryption?: 'aes256' | 'none';
  validation?: boolean;
}

export interface OTMQueryRequest {
  vehicleIds?: string[];
  driverIds?: string[];
  timeRange?: {
    start: string;
    end: string;
  };
  location?: {
    center: OTMLocation;
    radius: number; // in kilometers
  };
  limit?: number;
  offset?: number;
}

export interface OTMQueryResponse {
  success: boolean;
  data: OTMDataPackage;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
