import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState } from '../../types/app';

const initialState: AuthState = {
  isConsentGiven: false,
  sessionId: null,
  sessionExpiresAt: null,
  driverId: null,
  consentTimestamp: null,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    giveConsent: (state, action: PayloadAction<{ driverId: string; sessionId: string }>) => {
      const { driverId, sessionId } = action.payload;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      
      state.isConsentGiven = true;
      state.sessionId = sessionId;
      state.sessionExpiresAt = expiresAt.toISOString();
      state.driverId = driverId;
      state.consentTimestamp = now.toISOString();
      state.isAuthenticated = true;
    },
    revokeConsent: (state) => {
      state.isConsentGiven = false;
      state.sessionId = null;
      state.sessionExpiresAt = null;
      state.driverId = null;
      state.consentTimestamp = null;
      state.isAuthenticated = false;
    },
    sessionExpired: (state) => {
      state.isAuthenticated = false;
      state.sessionId = null;
      state.sessionExpiresAt = null;
    },
    restoreSession: (state, action: PayloadAction<AuthState>) => {
      const { isConsentGiven, sessionId, sessionExpiresAt, driverId, consentTimestamp } = action.payload;
      
      // Check if session is still valid
      if (sessionExpiresAt && new Date(sessionExpiresAt) > new Date()) {
        state.isConsentGiven = isConsentGiven;
        state.sessionId = sessionId;
        state.sessionExpiresAt = sessionExpiresAt;
        state.driverId = driverId;
        state.consentTimestamp = consentTimestamp;
        state.isAuthenticated = true;
      } else {
        // Session expired, clear all data
        state.isConsentGiven = false;
        state.sessionId = null;
        state.sessionExpiresAt = null;
        state.driverId = null;
        state.consentTimestamp = null;
        state.isAuthenticated = false;
      }
    },
  },
});

export const { giveConsent, revokeConsent, sessionExpired, restoreSession } = authSlice.actions;

export default authSlice.reducer;
