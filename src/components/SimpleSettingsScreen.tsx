import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { locationService } from '../services/LocationService';
import { OTMLocation } from '../types/otm5';

interface SettingsScreenProps {
  onNavigateToTracking: () => void;
  onRequestLocationPermission: () => void;
  onUploadTripData: () => void;
  onLogout: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateToTracking,
  onRequestLocationPermission,
  onUploadTripData,
  onLogout,
}) => {
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<string>('unknown');
  const [lastKnownLocation, setLastKnownLocation] = useState<OTMLocation | null>(null);
  const [gpsTestInProgress, setGpsTestInProgress] = useState(false);

  // Check location service status on mount
  useEffect(() => {
    checkLocationServiceStatus();
  }, []);

  const checkLocationServiceStatus = async () => {
    try {
      if (locationService.isLocationServiceAvailable()) {
        const status = await locationService.getLocationPermissionStatus();
        setLocationPermissionStatus(status.status);
        console.log('📍 Settings - Location permission status:', status.status);
      } else {
        setLocationPermissionStatus('not_available');
        console.log('📍 Settings - Location service not available');
      }
    } catch (error) {
      console.error('❌ Settings - Error checking location status:', error);
      setLocationPermissionStatus('error');
    }
  };
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will revoke consent and stop all tracking.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: onLogout
        }
      ]
    );
  };

  const handleTestLocationPermission = async () => {
    try {
      setGpsTestInProgress(true);
      console.log('🧪 Testing location permission...');
      
      if (!locationService.isLocationServiceAvailable()) {
        Alert.alert('GPS Test', 'Location service is not available on this device');
        return;
      }

      const result = await locationService.requestLocationPermission();
      setLocationPermissionStatus(result.status);
      
      Alert.alert(
        'Location Permission Test',
        `Permission Status: ${result.status}\n\nThis determines if BossTrack can access your device's GPS.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Location permission test failed:', error);
      Alert.alert('GPS Test Failed', `Error: ${error}`);
    } finally {
      setGpsTestInProgress(false);
    }
  };

  const handleTestGPSLocation = async () => {
    try {
      setGpsTestInProgress(true);
      console.log('🧪 Testing GPS location...');
      
      if (!locationService.isLocationServiceAvailable()) {
        Alert.alert('GPS Test', 'Location service is not available on this device');
        return;
      }

      const location = await locationService.getCurrentLocation();
      setLastKnownLocation(location);
      
      Alert.alert(
        'GPS Location Test',
        `✅ Successfully got GPS location!\n\nLatitude: ${location.latitude.toFixed(6)}\nLongitude: ${location.longitude.toFixed(6)}\nAccuracy: ±${location.accuracy || 'unknown'}m\n\nTimestamp: ${new Date(location.timestamp).toLocaleTimeString()}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ GPS location test failed:', error);
      Alert.alert('GPS Test Failed', `Could not get location: ${error}`);
    } finally {
      setGpsTestInProgress(false);
    }
  };

  const handleTestUpload = () => {
    Alert.alert(
      'Upload Test',
      'Testing trip data upload...',
      [{ text: 'OK', onPress: onUploadTripData }]
    );
  };

  const getPermissionStatusColor = (status: string): string => {
    switch (status) {
      case 'granted':
        return '#27ae60';
      case 'denied':
      case 'restricted':
        return '#e74c3c';
      case 'not_available':
        return '#95a5a6';
      default:
        return '#f39c12';
    }
  };

  const getPermissionStatusText = (status: string): string => {
    switch (status) {
      case 'granted':
        return '✅ Granted';
      case 'denied':
        return '❌ Denied';
      case 'restricted':
        return '⚠️ Restricted';
      case 'not_available':
        return '🚫 Not Available';
      case 'unknown':
        return '❓ Unknown';
      case 'error':
        return '💥 Error';
      default:
        return `❓ ${status}`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>App Configuration & Controls</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Navigation</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={onNavigateToTracking}
          >
            <Text style={styles.buttonText}>📍 Back to Tracking</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📡 GPS Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Service Available:</Text>
              <Text style={[
                styles.statusValue,
                { color: locationService.isLocationServiceAvailable() ? '#27ae60' : '#e74c3c' }
              ]}>
                {locationService.isLocationServiceAvailable() ? '✅ Yes' : '❌ No'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Permission Status:</Text>
              <Text style={[
                styles.statusValue,
                { color: getPermissionStatusColor(locationPermissionStatus) }
              ]}>
                {getPermissionStatusText(locationPermissionStatus)}
              </Text>
            </View>
            {lastKnownLocation && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Location:</Text>
                <Text style={styles.statusValue}>
                  {new Date(lastKnownLocation.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 GPS Testing</Text>
          <TouchableOpacity
            style={[styles.testButton, gpsTestInProgress && styles.testButtonDisabled]}
            onPress={handleTestLocationPermission}
            disabled={gpsTestInProgress}
          >
            <Text style={styles.testButtonText}>
              {gpsTestInProgress ? '⏳ Testing...' : '🔐 Test Location Permission'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.testButton, gpsTestInProgress && styles.testButtonDisabled]}
            onPress={handleTestGPSLocation}
            disabled={gpsTestInProgress}
          >
            <Text style={styles.testButtonText}>
              {gpsTestInProgress ? '⏳ Testing...' : '📍 Test GPS Location'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestUpload}
          >
            <Text style={styles.testButtonText}>📤 Test Trip Upload</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={checkLocationServiceStatus}
          >
            <Text style={styles.testButtonText}>🔄 Refresh GPS Status</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ App Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>Version: 1.0.0</Text>
            <Text style={styles.infoText}>Build: Simple (No Redux)</Text>
            <Text style={styles.infoText}>State Management: React Hooks</Text>
            <Text style={styles.infoText}>Redux-Saga: Disabled</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Account Actions</Text>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>🚪 Logout & Revoke Consent</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            BossTrack - Simple Version
          </Text>
          <Text style={styles.footerSubtext}>
            This version uses React hooks instead of Redux for state management.
            All functionality works without the complexity of Redux-Saga.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  testButton: {
    backgroundColor: '#f39c12',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  testButtonDisabled: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerInfo: {
    marginTop: 30,
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 18,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
