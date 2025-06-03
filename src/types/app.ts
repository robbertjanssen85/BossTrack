import { OTMLocation, OTMVehicle, OTMTrip, OTMDriver } from './otm5';

export interface AppState {
  auth: AuthState;
  tracking: TrackingState;
  vehicle: VehicleState;
  ui: UIState;
}

export interface AuthState {
  isConsentGiven: boolean;
  sessionId: string | null;
  sessionExpiresAt: string | null;
  driverId: string | null;
  consentTimestamp: string | null;
  isAuthenticated: boolean;
}

export interface TrackingState {
  isTracking: boolean;
  isLocationPermissionGranted: boolean;
  locationPermissionStatus: 'not_determined' | 'denied' | 'restricted' | 'when_in_use' | 'always' | 'unknown';
  currentTrip: OTMTrip | null;
  currentLocation: OTMLocation | null;
  locationBuffer: OTMLocation[];
  isBackgroundTracking: boolean;
  trackingStartTime: string | null;
  lastUploadTime: string | null;
  uploadQueue: OTMTrip[];
  error: string | null;
}

export interface VehicleState {
  currentVehicle: OTMVehicle | null;
  registeredVehicles: OTMVehicle[];
  licensePlate: string;
  isVehicleRegistered: boolean;
}

export interface UIState {
  currentScreen: 'consent' | 'tracking' | 'settings' | 'vehicle_setup' | 'sagaTest';
  isLoading: boolean;
  error: string | null;
  notification: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null;
}

// Action types
export type AppAction = 
  | AuthAction
  | TrackingAction
  | VehicleAction
  | UIAction;

export type AuthAction =
  | { type: 'AUTH_GIVE_CONSENT'; payload: { driverId: string; sessionId: string } }
  | { type: 'AUTH_REVOKE_CONSENT' }
  | { type: 'AUTH_SESSION_EXPIRED' }
  | { type: 'AUTH_RESTORE_SESSION'; payload: AuthState };

export type TrackingAction =
  | { type: 'TRACKING_START_REQUESTED' }
  | { type: 'TRACKING_STARTED'; payload: { tripId: string; startTime: string } }
  | { type: 'TRACKING_STOPPED' }
  | { type: 'TRACKING_LOCATION_UPDATED'; payload: OTMLocation }
  | { type: 'TRACKING_PERMISSION_UPDATED'; payload: { status: string; granted: boolean } }
  | { type: 'TRACKING_ERROR'; payload: string }
  | { type: 'TRACKING_UPLOAD_SUCCESS'; payload: { tripId: string; uploadTime: string } }
  | { type: 'TRACKING_UPLOAD_FAILED'; payload: { tripId: string; error: string } }
  | { type: 'TRACKING_BUFFER_LOCATIONS'; payload: OTMLocation[] }
  | { type: 'TRACKING_CLEAR_BUFFER' };

export type VehicleAction =
  | { type: 'VEHICLE_SET_LICENSE_PLATE'; payload: string }
  | { type: 'VEHICLE_REGISTER'; payload: OTMVehicle }
  | { type: 'VEHICLE_SELECT'; payload: string }
  | { type: 'VEHICLE_UNREGISTER'; payload: string };

export type UIAction =
  | { type: 'UI_SET_SCREEN'; payload: UIState['currentScreen'] }
  | { type: 'UI_SET_LOADING'; payload: boolean }
  | { type: 'UI_SET_ERROR'; payload: string | null }
  | { type: 'UI_SHOW_NOTIFICATION'; payload: UIState['notification'] }
  | { type: 'UI_CLEAR_NOTIFICATION' };

// Saga action types
export interface SagaActionTypes {
  SAGA_START_TRACKING: 'SAGA_START_TRACKING';
  SAGA_STOP_TRACKING: 'SAGA_STOP_TRACKING';
  SAGA_REQUEST_LOCATION_PERMISSION: 'SAGA_REQUEST_LOCATION_PERMISSION';
  SAGA_UPLOAD_TRIP_DATA: 'SAGA_UPLOAD_TRIP_DATA';
  SAGA_INITIALIZE_SESSION: 'SAGA_INITIALIZE_SESSION';
  SAGA_RESTORE_SESSION: 'SAGA_RESTORE_SESSION';
  SAGA_MONITOR_LOCATION: 'SAGA_MONITOR_LOCATION';
}

export interface LocationUpdateEvent {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  bearing?: number;
  speed?: number;
  timestamp: string;
}

export interface LocationErrorEvent {
  error: string;
  code: number;
}

export interface AuthorizationChangedEvent {
  status: string;
  timestamp: string;
}

// Constants
export const SESSION_DURATION_HOURS = 24;
export const LOCATION_BUFFER_SIZE = 100;
export const UPLOAD_INTERVAL_MINUTES = 5;
export const GPS_SAMPLING_RATE_HZ = 1;
