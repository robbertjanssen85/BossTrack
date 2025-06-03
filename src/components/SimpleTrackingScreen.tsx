import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { locationService } from '../services/LocationService';
import { OTMLocation } from '../types/otm5';

interface TrackingScreenProps {
  isTracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onNavigateToSettings: () => void;
}

const TrackingScreen: React.FC<TrackingScreenProps> = ({
  isTracking,
  onStartTracking,
  onStopTracking,
  onNavigateToSettings,
}) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [trackingStartTime, setTrackingStartTime] = useState<Date | null>(null);
  const [currentLocation, setCurrentLocation] = useState<OTMLocation | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<string>('unknown');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [useRealGPS, setUseRealGPS] = useState(true);
  const [simulatedLocation, setSimulatedLocation] = useState<{
    latitude: number;
    longitude: number;
    speed?: number;
    bearing?: number;
  } | null>(null);

  // Check location permission status on component mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (locationService.isLocationServiceAvailable()) {
          const status = await locationService.getLocationPermissionStatus();
          setLocationPermissionStatus(status.status);
          console.log('📍 Location permission status:', status.status);
        } else {
          setLocationPermissionStatus('not_available');
          setUseRealGPS(false);
          console.log('📍 Location service not available - using simulation');
        }
      } catch (error) {
        console.error('❌ Error checking location permissions:', error);
        setLocationError(`Permission check failed: ${error}`);
        setUseRealGPS(false);
      }
    };

    checkPermissions();
  }, []);

  // Setup location service listeners
  useEffect(() => {
    if (useRealGPS && locationService.isLocationServiceAvailable()) {
      // Subscribe to location updates
      locationService.subscribeToLocationUpdates((location: OTMLocation) => {
        console.log('📍 Real GPS location update:', location);
        setCurrentLocation(location);
        setLocationError(null);
      });

      // Subscribe to location errors
      locationService.subscribeToLocationErrors((error: string) => {
        console.error('❌ Location service error:', error);
        setLocationError(error);
      });

      // Subscribe to authorization changes
      locationService.subscribeToAuthorizationChanges((status: string) => {
        console.log('📍 Location authorization changed:', status);
        setLocationPermissionStatus(status);
        if (status === 'denied' || status === 'restricted') {
          setUseRealGPS(false);
        }
      });

      return () => {
        locationService.unsubscribeAll();
      };
    }
  }, [useRealGPS]);

  // Start tracking time when tracking begins
  useEffect(() => {
    if (isTracking && !trackingStartTime) {
      setTrackingStartTime(new Date());
    } else if (!isTracking) {
      setTrackingStartTime(null);
      setElapsedTime('00:00:00');
    }
  }, [isTracking]);

  // Update elapsed time
  useEffect(() => {
    if (isTracking && trackingStartTime) {
      const interval = setInterval(() => {
        const start = trackingStartTime;
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isTracking, trackingStartTime]);

  // Simulate location updates when tracking (fallback if real GPS not available)
  useEffect(() => {
    if (isTracking && !useRealGPS) {
      console.log('📍 Using simulated location data');
      const interval = setInterval(() => {
        // Simulate location updates with OTM-compatible format
        const location: OTMLocation = {
          latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
          longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
          speed: Math.random() * 60,
          bearing: Math.random() * 360,
          accuracy: 5 + Math.random() * 10,
          altitude: 50 + (Math.random() - 0.5) * 20,
          timestamp: new Date().toISOString(),
        };
        setCurrentLocation(location);
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (!isTracking) {
      setCurrentLocation(null);
    }
  }, [isTracking, useRealGPS]);

  const handleStartTracking = async () => {
    try {
      // Request permission if needed
      if (useRealGPS && locationService.isLocationServiceAvailable()) {
        if (locationPermissionStatus === 'unknown' || locationPermissionStatus === 'denied') {
          console.log('📍 Requesting location permission...');
          const permissionResult = await locationService.requestLocationPermission();
          setLocationPermissionStatus(permissionResult.status);
          
          if (permissionResult.status === 'denied' || permissionResult.status === 'restricted') {
            Alert.alert(
              'Location Permission Required',
              'BossTrack needs location access to track your trips. You can enable this in Settings or continue with simulated data.',
              [
                { text: 'Use Simulation', onPress: () => startTrackingWithSimulation() },
                { text: 'Settings', onPress: () => onNavigateToSettings() },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
            return;
          }
        }

        // Start real GPS tracking
        console.log('📍 Starting real GPS tracking...');
        const result = await locationService.startTracking();
        console.log('📍 GPS tracking started:', result);
        
        // Get current location immediately
        try {
          const currentLoc = await locationService.getCurrentLocation();
          setCurrentLocation(currentLoc);
          console.log('📍 Initial location:', currentLoc);
        } catch (error) {
          console.warn('📍 Could not get initial location:', error);
        }
      } else {
        startTrackingWithSimulation();
      }

      onStartTracking();
    } catch (error) {
      console.error('❌ Error starting GPS tracking:', error);
      Alert.alert(
        'GPS Error',
        `Could not start GPS tracking: ${error}. Would you like to use simulated location data instead?`,
        [
          { text: 'Use Simulation', onPress: () => startTrackingWithSimulation() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const startTrackingWithSimulation = () => {
    console.log('📍 Starting tracking with simulated location data');
    setUseRealGPS(false);
    setLocationError(null);
    onStartTracking();
  };

  const handleStopTracking = async () => {
    Alert.alert(
      'Stop Tracking',
      'Are you sure you want to stop tracking? Your trip data will be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Stop', 
          style: 'destructive',
          onPress: async () => {
            console.log('⏹️ Stopping location tracking...');
            
            // Stop real GPS tracking if it was active
            if (useRealGPS && locationService.isLocationServiceAvailable()) {
              try {
                const result = await locationService.stopTracking();
                console.log('📍 GPS tracking stopped:', result);
              } catch (error) {
                console.error('❌ Error stopping GPS tracking:', error);
              }
            }
            
            onStopTracking();
          }
        }
      ]
    );
  };

  const formatSpeed = (speed?: number): string => {
    if (!speed) return '0 mph';
    return `${Math.round(speed)} mph`;
  };

  const formatCoordinate = (coord: number): string => {
    return coord.toFixed(6);
  };

  const formatAccuracy = (accuracy?: number): string => {
    if (!accuracy) return 'Unknown';
    return `±${Math.round(accuracy)}m`;
  };

  const getLocationStatusDisplay = (): { text: string; color: string } => {
    if (!useRealGPS) {
      return { text: '🎯 SIMULATED', color: '#FF9500' };
    }
    
    if (locationError) {
      return { text: '❌ GPS ERROR', color: '#FF3B30' };
    }
    
    if (currentLocation) {
      const accuracy = currentLocation.accuracy || 999;
      if (accuracy <= 5) {
        return { text: '🎯 EXCELLENT GPS', color: '#34C759' };
      } else if (accuracy <= 15) {
        return { text: '📍 GOOD GPS', color: '#34C759' };
      } else if (accuracy <= 50) {
        return { text: '📡 FAIR GPS', color: '#FF9500' };
      } else {
        return { text: '📶 WEAK GPS', color: '#FF9500' };
      }
    }
    
    return { text: '🔍 SEARCHING...', color: '#007AFF' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>BossTrack</Text>
          <Text style={styles.subtitle}>Vehicle Location Tracking</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Tracking Status</Text>
            <View style={[
              styles.statusIndicator,
              isTracking ? styles.statusActive : styles.statusInactive
            ]}>
              <Text style={styles.statusText}>
                {isTracking ? '🟢 ACTIVE' : '🔴 INACTIVE'}
              </Text>
            </View>
          </View>

          {/* GPS Status Display */}
          <View style={styles.gpsStatusContainer}>
            <Text style={styles.gpsStatusLabel}>Location Source:</Text>
            <Text style={[
              styles.gpsStatusText,
              { color: getLocationStatusDisplay().color }
            ]}>
              {getLocationStatusDisplay().text}
            </Text>
          </View>

          {/* Error Display */}
          {locationError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {locationError}</Text>
            </View>
          )}

          {isTracking && (
            <View style={styles.trackingInfo}>
              <View style={styles.timeDisplay}>
                <Text style={styles.timeLabel}>Elapsed Time</Text>
                <Text style={styles.timeValue}>{elapsedTime}</Text>
              </View>
            </View>
          )}
        </View>

        {currentLocation && (
          <View style={styles.locationCard}>
            <Text style={styles.cardTitle}>📍 Current Location</Text>
            <View style={styles.locationInfo}>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Latitude:</Text>
                <Text style={styles.coordinateValue}>
                  {formatCoordinate(currentLocation.latitude)}
                </Text>
              </View>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Longitude:</Text>
                <Text style={styles.coordinateValue}>
                  {formatCoordinate(currentLocation.longitude)}
                </Text>
              </View>
              {currentLocation.speed !== undefined && (
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Speed:</Text>
                  <Text style={styles.coordinateValue}>
                    {formatSpeed(currentLocation.speed)}
                  </Text>
                </View>
              )}
              {currentLocation.bearing !== undefined && (
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Bearing:</Text>
                  <Text style={styles.coordinateValue}>
                    {Math.round(currentLocation.bearing)}°
                  </Text>
                </View>
              )}
              {currentLocation.accuracy !== undefined && (
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Accuracy:</Text>
                  <Text style={styles.coordinateValue}>
                    {formatAccuracy(currentLocation.accuracy)}
                  </Text>
                </View>
              )}
              {currentLocation.altitude !== undefined && (
                <View style={styles.coordinateRow}>
                  <Text style={styles.coordinateLabel}>Altitude:</Text>
                  <Text style={styles.coordinateValue}>
                    {Math.round(currentLocation.altitude)}m
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          {!isTracking ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartTracking}
            >
              <Text style={styles.startButtonText}>
                🚀 Start Tracking
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopTracking}
            >
              <Text style={styles.stopButtonText}>
                ⏹️ Stop Tracking
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={onNavigateToSettings}
          >
            <Text style={styles.settingsButtonText}>
              ⚙️ Settings
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Tracking Information</Text>
          <Text style={styles.infoText}>
            • Location is tracked at 1Hz (once per second) when active
          </Text>
          <Text style={styles.infoText}>
            • Your precise location is recorded for operational purposes
          </Text>
          <Text style={styles.infoText}>
            • Trip data is automatically uploaded when tracking stops
          </Text>
          <Text style={styles.infoText}>
            • You can revoke consent and stop tracking at any time
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
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: '#d5f4e6',
  },
  statusInactive: {
    backgroundColor: '#ffeaa7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  gpsStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gpsStatusLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  gpsStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 14,
    fontWeight: '500',
  },
  trackingInfo: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 15,
  },
  timeDisplay: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27ae60',
    fontFamily: 'monospace',
  },
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  locationInfo: {
    gap: 10,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordinateLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  coordinateValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  actionButtons: {
    gap: 15,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginBottom: 5,
  },
});

export default TrackingScreen;
