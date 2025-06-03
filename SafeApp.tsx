import React, { useEffect, ErrorInfo, Component, ReactNode } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Alert,
  Text,
  SafeAreaView,
} from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { safeStore, RootState } from './src/store/safeStore';
import { sagaActions } from './src/sagas/safeSagas';
import ConsentScreen from './src/components/ConsentScreen';
import TrackingScreen from './src/components/TrackingScreen';
import SettingsScreen from './src/components/SettingsScreen';
import { clearNotification } from './src/store/slices/uiSlice';

// Import polyfills
import 'react-native-get-random-values';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 React Error Boundary caught an error:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={errorStyles.container}>
          <View style={errorStyles.content}>
            <Text style={errorStyles.title}>🚨 App Error</Text>
            <Text style={errorStyles.message}>
              Something went wrong. Please restart the app.
            </Text>
            <Text style={errorStyles.error}>
              {this.state.error?.message || 'Unknown error'}
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const { currentScreen, notification, error } = useSelector((state: RootState) => state.ui);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Initialize session on app start with delay
  useEffect(() => {
    console.log('🏁 Safe AppContent mounted, initializing session...');
    
    // Delay saga dispatch to ensure store is fully initialized
    const timer = setTimeout(() => {
      console.log('🔄 Dispatching safe saga action: initializeSession');
      try {
        dispatch(sagaActions.initializeSession());
        console.log('✅ Safe saga action dispatched successfully');
      } catch (error) {
        console.error('❌ Error dispatching saga action:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
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
    try {
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
    } catch (error) {
      console.error('❌ Error rendering screen:', error);
      return (
        <SafeAreaView style={errorStyles.container}>
          <Text style={errorStyles.title}>Screen Error</Text>
          <Text style={errorStyles.message}>Unable to render screen</Text>
        </SafeAreaView>
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ErrorBoundary>
        {renderScreen()}
      </ErrorBoundary>
    </View>
  );
};

const SafeApp: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={safeStore}>
        <AppContent />
      </Provider>
    </ErrorBoundary>
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
  content: {
    alignItems: 'center',
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

export default SafeApp;
