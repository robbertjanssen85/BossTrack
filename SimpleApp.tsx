import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Alert,
  Text,
  SafeAreaView,
} from 'react-native';
import SimpleConsentScreen from './src/components/SimpleConsentScreen';
import SimpleTrackingScreen from './src/components/SimpleTrackingScreen';
import SimpleSettingsScreen from './src/components/SimpleSettingsScreen';
import { authService, AuthUser } from './src/services/AuthService';
import { tripService, TripData } from './src/services/TripService';

// Import polyfills
import 'react-native-get-random-values';

// Simple app state interface
interface AppState {
  user: AuthUser | null;
  currentScreen: 'consent' | 'tracking' | 'settings';
  currentTrip: TripData | null;
  notification: {
    type: 'info' | 'success' | 'error';
    message: string;
  } | null;
  error: string | null;
}

const SimpleApp: React.FC = () => {
  // Use React state instead of Redux
  const [appState, setAppState] = useState<AppState>({
    user: null,
    currentScreen: 'consent',
    currentTrip: null,
    notification: null,
    error: null,
  });

  // Initialize app on startup
  useEffect(() => {
    console.log('🏁 Simple App mounted, initializing...');
    initializeApp();
  }, []);

  // Initialize app session
  const initializeApp = async () => {
    try {
      // Try to restore existing session
      const user = await authService.initializeSession();
      
      if (user) {
        console.log('✅ Session restored for user:', user.id);
        
        // Check if user still has valid consent
        if (authService.hasValidConsent()) {
          setAppState(prev => ({
            ...prev,
            user,
            currentScreen: 'tracking',
            notification: {
              type: 'success',
              message: 'Welcome back! Session restored.'
            }
          }));
        } else {
          // Consent expired, need to re-consent
          setAppState(prev => ({
            ...prev,
            user: null,
            currentScreen: 'consent',
            notification: {
              type: 'info',
              message: 'Your consent has expired. Please provide consent again.'
            }
          }));
        }
      } else {
        console.log('ℹ️ No existing session found');
        setAppState(prev => ({
          ...prev,
          notification: {
            type: 'info',
            message: 'Welcome to BossTrack! Please provide consent to continue.'
          }
        }));
      }
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      setAppState(prev => ({
        ...prev,
        error: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  // Handle notifications
  useEffect(() => {
    if (appState.notification) {
      Alert.alert(
        appState.notification.type.charAt(0).toUpperCase() + appState.notification.type.slice(1),
        appState.notification.message,
        [{ 
          text: 'OK', 
          onPress: () => setAppState(prev => ({ ...prev, notification: null }))
        }]
      );
    }
  }, [appState.notification]);

  // Handle errors
  useEffect(() => {
    if (appState.error) {
      Alert.alert(
        'Error',
        appState.error,
        [{ 
          text: 'OK',
          onPress: () => setAppState(prev => ({ ...prev, error: null }))
        }]
      );
    }
  }, [appState.error]);

  // App actions (replacing Redux actions)
  const appActions = {
    authenticate: (user: AuthUser) => {
      console.log('🔐 User authenticated:', user.id);
      setAppState(prev => ({
        ...prev,
        user,
        currentScreen: 'tracking',
        notification: {
          type: 'success',
          message: `Welcome, ${user.fullName}!`
        }
      }));
    },

    navigateToScreen: (screen: 'consent' | 'tracking' | 'settings') => {
      console.log(`📱 Navigating to ${screen} screen`);
      setAppState(prev => ({ ...prev, currentScreen: screen }));
    },

    startTracking: async () => {
      try {
        console.log('📍 Starting location tracking...');
        
        const vehicleInfo = {
          plate: 'UNKNOWN', // Would get from user profile or form
          type: 'van' as const
        };
        
        const trip = await tripService.startTrip(vehicleInfo);
        
        setAppState(prev => ({
          ...prev,
          currentTrip: trip,
          notification: {
            type: 'success',
            message: 'Location tracking started'
          }
        }));
      } catch (error) {
        console.error('❌ Failed to start tracking:', error);
        setAppState(prev => ({
          ...prev,
          error: `Failed to start tracking: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }
    },

    stopTracking: async () => {
      try {
        console.log('⏹️ Stopping location tracking...');
        
        const completedTrip = await tripService.stopTrip();
        
        setAppState(prev => ({
          ...prev,
          currentTrip: null,
          notification: {
            type: 'success',
            message: completedTrip 
              ? `Trip completed! Distance: ${completedTrip.distanceKm?.toFixed(2) || 0} km`
              : 'Location tracking stopped'
          }
        }));
      } catch (error) {
        console.error('❌ Failed to stop tracking:', error);
        setAppState(prev => ({
          ...prev,
          error: `Failed to stop tracking: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }
    },

    requestLocationPermission: () => {
      console.log('🔐 Requesting location permission...');
      setAppState(prev => ({
        ...prev,
        notification: {
          type: 'info',
          message: 'Location permission requested'
        }
      }));
    },

    uploadTripData: async () => {
      try {
        console.log('📤 Getting trip history...');
        
        const trips = await tripService.getTripHistory(10);
        
        setAppState(prev => ({
          ...prev,
          notification: {
            type: 'success',
            message: `Found ${trips.length} trips in history`
          }
        }));
      } catch (error) {
        console.error('❌ Failed to get trip data:', error);
        setAppState(prev => ({
          ...prev,
          error: `Failed to get trip data: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }
    },

    showError: (error: string) => {
      console.error('❌ App error:', error);
      setAppState(prev => ({ ...prev, error }));
    },

    logout: async () => {
      try {
        console.log('🚪 Logging out...');
        
        // Stop any active trip
        if (appState.currentTrip) {
          await tripService.stopTrip();
        }
        
        // Sign out user
        await authService.signOut();
        
        // Reset app state
        setAppState({
          user: null,
          currentScreen: 'consent',
          currentTrip: null,
          notification: {
            type: 'info',
            message: 'You have been logged out'
          },
          error: null,
        });
      } catch (error) {
        console.error('❌ Logout failed:', error);
        setAppState(prev => ({
          ...prev,
          error: `Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }));
      }
    }
  };

  // Determine which screen to show
  const renderScreen = () => {
    try {
      // If not authenticated, always show consent screen
      if (!appState.user) {
        return <SimpleConsentScreen onAuthenticate={appActions.authenticate} />;
      }

      // Show requested screen if authenticated
      switch (appState.currentScreen) {
        case 'tracking':
          return (
            <SimpleTrackingScreen 
              isTracking={appState.currentTrip !== null}
              onStartTracking={appActions.startTracking}
              onStopTracking={appActions.stopTracking}
              onNavigateToSettings={() => appActions.navigateToScreen('settings')}
            />
          );
        case 'settings':
          return (
            <SimpleSettingsScreen 
              onNavigateToTracking={() => appActions.navigateToScreen('tracking')}
              onRequestLocationPermission={appActions.requestLocationPermission}
              onUploadTripData={appActions.uploadTripData}
              onLogout={appActions.logout}
            />
          );
        case 'consent':
          return <SimpleConsentScreen onAuthenticate={appActions.authenticate} />;
        default:
          return (
            <SimpleTrackingScreen 
              isTracking={appState.currentTrip !== null}
              onStartTracking={appActions.startTracking}
              onStopTracking={appActions.stopTracking}
              onNavigateToSettings={() => appActions.navigateToScreen('settings')}
            />
          );
      }
    } catch (error) {
      console.error('❌ Error rendering screen:', error);
      return (
        <SafeAreaView style={errorStyles.container}>
          <Text style={errorStyles.title}>Screen Error</Text>
          <Text style={errorStyles.message}>Unable to render screen</Text>
          <Text style={errorStyles.error}>{String(error)}</Text>
        </SafeAreaView>
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {renderScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  error: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});

export default SimpleApp;
