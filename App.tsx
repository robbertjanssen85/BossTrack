import React, { useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Alert,
} from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from './src/store';
import { sagaActions } from './src/sagas/index';
import ConsentScreen from './src/components/ConsentScreen';
import TrackingScreen from './src/components/TrackingScreen';
import SettingsScreen from './src/components/SettingsScreen';
import { clearNotification } from './src/store/slices/uiSlice';

// Import polyfills
import 'react-native-get-random-values';

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const { currentScreen, notification, error } = useSelector((state: RootState) => state.ui);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Initialize session on app start
  useEffect(() => {
    console.log('🏁 AppContent mounted, initializing session...');
    console.log('🔄 Dispatching saga action: initializeSession');
    // Re-enable saga action now that Redux-Saga is working
    dispatch(sagaActions.initializeSession());
    console.log('✅ Saga action dispatched successfully');
  }, [dispatch]);

  // Handle notifications
  useEffect(() => {
    if (notification) {
      Alert.alert(
        notification.type.charAt(0).toUpperCase() + notification.type.slice(1),
        notification.message,
        [{ text: 'OK', onPress: () => dispatch(clearNotification()) }]
      );
    }
  }, [notification, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Error',
        error,
        [{ text: 'OK' }]
      );
    }
  }, [error]);

  // Determine which screen to show
  const renderScreen = () => {
    // If not authenticated, always show consent screen
    if (!isAuthenticated) {
      return <ConsentScreen />;
    }

    // Show requested screen if authenticated
    switch (currentScreen) {
      case 'tracking':
        return <TrackingScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'consent':
        return <ConsentScreen />;
      default:
        return <TrackingScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      {renderScreen()}
    </View>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default App;
