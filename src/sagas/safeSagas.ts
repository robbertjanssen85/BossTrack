import { all, takeLatest, call, put, delay } from 'redux-saga/effects';

// Action types for saga
const SAGA_START_TRACKING = 'SAGA_START_TRACKING';
const SAGA_STOP_TRACKING = 'SAGA_STOP_TRACKING';
const SAGA_REQUEST_LOCATION_PERMISSION = 'SAGA_REQUEST_LOCATION_PERMISSION';
const SAGA_UPLOAD_TRIP_DATA = 'SAGA_UPLOAD_TRIP_DATA';
const SAGA_INITIALIZE_SESSION = 'SAGA_INITIALIZE_SESSION';

// Safe saga wrapper with error handling
function* safeSagaWrapper(saga: any, ...args: any[]) {
  try {
    yield call(saga, ...args);
  } catch (error) {
    console.error('❌ Saga error:', error);
    // Could dispatch error action here if needed
  }
}

// Saga functions with proper error handling
function* initializeSessionSaga(): Generator<any, void, any> {
  try {
    console.log('🚀 Redux-Saga: Initialize session saga started');
    
    // Simulate async initialization with proper delay
    yield delay(100);
    console.log('✅ Redux-Saga: Session initialization completed successfully');
  } catch (error) {
    console.error('❌ Redux-Saga: Session initialization failed:', error);
  }
}

function* requestLocationPermissionSaga(): Generator<any, void, any> {
  try {
    console.log('🔐 Redux-Saga: Request location permission saga started');
    yield delay(50);
    console.log('✅ Redux-Saga: Location permission saga completed');
  } catch (error) {
    console.error('❌ Redux-Saga: Location permission failed:', error);
  }
}

function* startTrackingSaga(): Generator<any, void, any> {
  try {
    console.log('📍 Redux-Saga: Start tracking saga started');
    yield delay(50);
    console.log('✅ Redux-Saga: Start tracking saga completed');
  } catch (error) {
    console.error('❌ Redux-Saga: Start tracking failed:', error);
  }
}

function* stopTrackingSaga(): Generator<any, void, any> {
  try {
    console.log('⏹️ Redux-Saga: Stop tracking saga started');
    yield delay(50);
    console.log('✅ Redux-Saga: Stop tracking saga completed');
  } catch (error) {
    console.error('❌ Redux-Saga: Stop tracking failed:', error);
  }
}

function* uploadTripDataSaga(): Generator<any, void, any> {
  try {
    console.log('📤 Redux-Saga: Upload trip data saga started');
    yield delay(50);
    console.log('✅ Redux-Saga: Upload trip data saga completed');
  } catch (error) {
    console.error('❌ Redux-Saga: Upload trip data failed:', error);
  }
}

// Root saga with error boundaries
export function* rootSaga() {
  try {
    console.log('🎭 Redux-Saga: Root saga initialized and watching for actions...');
    
    yield all([
      takeLatest(SAGA_INITIALIZE_SESSION, safeSagaWrapper, initializeSessionSaga),
      takeLatest(SAGA_REQUEST_LOCATION_PERMISSION, safeSagaWrapper, requestLocationPermissionSaga),
      takeLatest(SAGA_START_TRACKING, safeSagaWrapper, startTrackingSaga),
      takeLatest(SAGA_STOP_TRACKING, safeSagaWrapper, stopTrackingSaga),
      takeLatest(SAGA_UPLOAD_TRIP_DATA, safeSagaWrapper, uploadTripDataSaga),
    ]);
    
    console.log('✅ Redux-Saga: All watchers are active and ready');
  } catch (error) {
    console.error('❌ Redux-Saga: Root saga error:', error);
  }
}

// Action creators for saga
export const sagaActions = {
  initializeSession: () => ({ type: SAGA_INITIALIZE_SESSION }),
  requestLocationPermission: () => ({ type: SAGA_REQUEST_LOCATION_PERMISSION }),
  startTracking: () => ({ type: SAGA_START_TRACKING }),
  stopTracking: () => ({ type: SAGA_STOP_TRACKING }),
  uploadTripData: () => ({ type: SAGA_UPLOAD_TRIP_DATA }),
};
