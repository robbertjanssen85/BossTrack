import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from './slices/authSlice';
import trackingReducer from './slices/trackingSlice';
import vehicleReducer from './slices/vehicleSlice';
import uiReducer from './slices/uiSlice';
import { rootSaga } from '../sagas/index';

// Create saga middleware
const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
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

// Run the saga after store is created
try {
  console.log('🎭 Starting Redux-Saga middleware...');
  sagaMiddleware.run(rootSaga);
  console.log('✅ Redux-Saga middleware started successfully');
} catch (error) {
  console.error('❌ Error starting saga middleware:', error);
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Default export
export default store;
