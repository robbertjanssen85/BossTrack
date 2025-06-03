import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '../../types/app';

const initialState: UIState = {
  currentScreen: 'consent',
  isLoading: false,
  error: null,
  notification: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setScreen: (state, action: PayloadAction<UIState['currentScreen']>) => {
      state.currentScreen = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    showNotification: (state, action: PayloadAction<UIState['notification']>) => {
      state.notification = action.payload;
    },
    clearNotification: (state) => {
      state.notification = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setScreen,
  setLoading,
  setError,
  showNotification,
  clearNotification,
  clearError,
} = uiSlice.actions;

export default uiSlice.reducer;
