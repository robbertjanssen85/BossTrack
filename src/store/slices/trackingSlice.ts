import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TrackingState } from '../../types/app';
import { OTMLocation, OTMTrip } from '../../types/otm5';

const initialState: TrackingState = {
  isTracking: false,
  isLocationPermissionGranted: false,
  locationPermissionStatus: 'not_determined',
  currentTrip: null,
  currentLocation: null,
  locationBuffer: [],
  isBackgroundTracking: false,
  trackingStartTime: null,
  lastUploadTime: null,
  uploadQueue: [],
  error: null,
};

export const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    startTracking: (state, action: PayloadAction<{ tripId: string; startTime: string }>) => {
      const { tripId, startTime } = action.payload;
      state.isTracking = true;
      state.trackingStartTime = startTime;
      state.error = null;
      
      // Initialize current trip
      state.currentTrip = {
        tripId,
        sessionId: '', // Will be set by saga
        vehicleId: '', // Will be set by saga
        driverId: '', // Will be set by saga
        startTime,
        status: 'active',
        locations: [],
        metadata: {
          appVersion: '1.0.0',
          deviceId: '', // Will be set by saga
          platform: 'ios',
          samplingRate: 1,
          dataQuality: 'high',
        },
      };
    },
    stopTracking: (state) => {
      state.isTracking = false;
      state.isBackgroundTracking = false;
      state.trackingStartTime = null;
      
      if (state.currentTrip) {
        state.currentTrip.endTime = new Date().toISOString();
        state.currentTrip.status = 'completed';
        state.uploadQueue.push(state.currentTrip);
        state.currentTrip = null;
      }
      
      state.locationBuffer = [];
    },
    updateLocation: (state, action: PayloadAction<OTMLocation>) => {
      const location = action.payload;
      state.currentLocation = location;
      
      // Add to buffer
      state.locationBuffer.push(location);
      
      // Keep buffer size manageable
      if (state.locationBuffer.length > 1000) {
        state.locationBuffer = state.locationBuffer.slice(-500);
      }
      
      // Add to current trip if tracking
      if (state.currentTrip && state.isTracking) {
        state.currentTrip.locations.push(location);
      }
    },
    updateLocationPermission: (state, action: PayloadAction<{ status: string; granted: boolean }>) => {
      const { status, granted } = action.payload;
      state.locationPermissionStatus = status as any;
      state.isLocationPermissionGranted = granted;
    },
    setTrackingError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isTracking = false;
      state.isBackgroundTracking = false;
    },
    uploadSuccess: (state, action: PayloadAction<{ tripId: string; uploadTime: string }>) => {
      const { tripId, uploadTime } = action.payload;
      state.lastUploadTime = uploadTime;
      state.uploadQueue = state.uploadQueue.filter(trip => trip.tripId !== tripId);
    },
    uploadFailed: (state, action: PayloadAction<{ tripId: string; error: string }>) => {
      state.error = action.payload.error;
    },
    bufferLocations: (state, action: PayloadAction<OTMLocation[]>) => {
      state.locationBuffer.push(...action.payload);
      
      // Keep buffer size manageable
      if (state.locationBuffer.length > 1000) {
        state.locationBuffer = state.locationBuffer.slice(-500);
      }
    },
    clearBuffer: (state) => {
      state.locationBuffer = [];
    },
    setBackgroundTracking: (state, action: PayloadAction<boolean>) => {
      state.isBackgroundTracking = action.payload;
    },
  },
});

export const {
  startTracking,
  stopTracking,
  updateLocation,
  updateLocationPermission,
  setTrackingError,
  uploadSuccess,
  uploadFailed,
  bufferLocations,
  clearBuffer,
  setBackgroundTracking,
} = trackingSlice.actions;

export default trackingSlice.reducer;
