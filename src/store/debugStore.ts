import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import trackingReducer from './slices/trackingSlice';
import vehicleReducer from './slices/vehicleSlice';
import uiReducer from './slices/uiSlice';

// Simple store without saga middleware for debugging
export const debugStore = configureStore({
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
    }),
});

console.log('🐛 Debug store created successfully');

export type RootState = ReturnType<typeof debugStore.getState>;
export type AppDispatch = typeof debugStore.dispatch;

export default debugStore;
