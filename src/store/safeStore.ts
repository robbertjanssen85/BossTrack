import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from './slices/authSlice';
import trackingReducer from './slices/trackingSlice';
import vehicleReducer from './slices/vehicleSlice';
import uiReducer from './slices/uiSlice';
import { rootSaga } from '../sagas/safeSagas';

// Create saga middleware with error handling
const sagaMiddleware = createSagaMiddleware({
  onError: (error, { sagaStack }) => {
    console.error('🚨 Saga middleware error:', error);
    console.error('Saga stack:', sagaStack);
  },
});

export const safeStore = configureStore({
  reducer: {
    auth: authReducer,
    tracking: trackingReducer,
    vehicle: vehicleReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(sagaMiddleware),
});

// Run the saga with comprehensive error handling
try {
  console.log('🎭 Starting safe Redux-Saga middleware...');
  sagaMiddleware.run(rootSaga);
  console.log('✅ Safe Redux-Saga middleware started successfully');
} catch (error) {
  console.error('❌ Critical error starting saga middleware:', error);
}

export type RootState = ReturnType<typeof safeStore.getState>;
export type AppDispatch = typeof safeStore.dispatch;

export default safeStore;
