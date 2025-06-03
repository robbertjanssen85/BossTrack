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
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { sagaActions } from '../sagas/index';
import { setScreen, showNotification } from '../store/slices/uiSlice';
import { revokeConsent } from '../store/slices/authSlice';

const TrackingScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { isTracking, currentLocation, trackingStartTime, locationPermissionStatus } = useSelector(
    (state: RootState) => state.tracking
  );
  const { currentVehicle } = useSelector((state: RootState) => state.vehicle);
  const { sessionExpiresAt } = useSelector((state: RootState) => state.auth);
  const { isLoading } = useSelector((state: RootState) => state.ui);
  
  const [elapsedTime, setElapsedTime] = useState('00:00:00');

  // Update elapsed time
  useEffect(() => {
    if (isTracking && trackingStartTime) {
      const interval = setInterval(() => {
        const start = new Date(trackingStartTime);
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

  const handleStartTracking = () => {
    if (locationPermissionStatus !== 'always' && locationPermissionStatus !== 'when_in_use') {
      Alert.alert(
        'Location Permission Required',
        'Please grant location permission to start tracking.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Grant Permission', 
            onPress: () => dispatch(sagaActions.requestLocationPermission())
          }
        ]
      );
      return;
    }

    dispatch(sagaActions.startTracking());
  };

  const handleStopTracking = () => {
    Alert.alert(
      'Stop Tracking',
      'Are you sure you want to stop tracking? This will end the current trip.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Stop Tracking', 
          onPress: () => dispatch(sagaActions.stopTracking()),
          style: 'destructive'
        }
      ]
    );
  };

  const handleRevokeConsent = () => {
    Alert.alert(
      'Revoke Consent',
      'This will stop tracking and clear all session data. You will need to give consent again to use the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Revoke Consent', 
          onPress: () => {
            if (isTracking) {
              dispatch(sagaActions.stopTracking());
            }
            dispatch(revokeConsent());
            dispatch(setScreen('consent'));
            dispatch(showNotification({
              message: 'Consent revoked successfully',
              type: 'info',
            }));
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleSettings = () => {
    dispatch(setScreen('settings'));
  };

  const formatLocation = (lat: number, lon: number) => {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getSessionTimeRemaining = () => {
    if (!sessionExpiresAt) return 'Unknown';
    
    const expires = new Date(sessionExpiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getLocationAccuracyText = (accuracy?: number) => {
    if (!accuracy) return 'Unknown';
    if (accuracy < 5) return 'Excellent';
    if (accuracy < 10) return 'Good';
    if (accuracy < 20) return 'Fair';
    return 'Poor';
  };

  const getLocationAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return '#999';
    if (accuracy < 5) return '#28a745';
    if (accuracy < 10) return '#ffc107';
    if (accuracy < 20) return '#fd7e14';
    return '#dc3545';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>BossTrack</Text>
          <Text style={styles.subtitle}>Vehicle Location Tracking</Text>
        </View>

        {/* Vehicle Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>License Plate:</Text>
            <Text style={styles.infoValue}>
              {currentVehicle?.licensePlate || 'Not registered'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle Type:</Text>
            <Text style={styles.infoValue}>
              {currentVehicle?.vehicleType || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Tracking Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tracking Status</Text>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: isTracking ? '#28a745' : '#dc3545' }
            ]} />
            <Text style={[
              styles.statusText,
              { color: isTracking ? '#28a745' : '#dc3545' }
            ]}>
              {isTracking ? 'TRACKING ACTIVE' : 'TRACKING STOPPED'}
            </Text>
          </View>
          
          {isTracking && (
            <View style={styles.trackingInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Elapsed Time:</Text>
                <Text style={styles.infoValue}>{elapsedTime}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Start Time:</Text>
                <Text style={styles.infoValue}>
                  {trackingStartTime ? formatTimestamp(trackingStartTime) : 'Unknown'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Location Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Location</Text>
          {currentLocation ? (
            <View style={styles.locationInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Coordinates:</Text>
                <Text style={styles.infoValue}>
                  {formatLocation(currentLocation.latitude, currentLocation.longitude)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Accuracy:</Text>
                <Text style={[
                  styles.infoValue,
                  { color: getLocationAccuracyColor(currentLocation.accuracy) }
                ]}>
                  {currentLocation.accuracy ? `${currentLocation.accuracy.toFixed(1)}m` : 'Unknown'} 
                  ({getLocationAccuracyText(currentLocation.accuracy)})
                </Text>
              </View>
              {currentLocation.speed !== undefined && currentLocation.speed >= 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Speed:</Text>
                  <Text style={styles.infoValue}>
                    {(currentLocation.speed * 3.6).toFixed(1)} km/h
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Update:</Text>
                <Text style={styles.infoValue}>
                  {formatTimestamp(currentLocation.timestamp)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noLocationText}>No location data available</Text>
          )}
        </View>

        {/* Session Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time Remaining:</Text>
            <Text style={styles.infoValue}>{getSessionTimeRemaining()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location Permission:</Text>
            <Text style={[
              styles.infoValue,
              { color: locationPermissionStatus === 'always' ? '#28a745' : '#dc3545' }
            ]}>
              {locationPermissionStatus.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isTracking ? (
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={handleStartTracking}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Starting...' : 'Start Tracking'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStopTracking}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Stopping...' : 'Stop Tracking'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.settingsButton]}
            onPress={handleSettings}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.settingsButtonText]}>
              Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.revokeButton]}
            onPress={handleRevokeConsent}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.revokeButtonText]}>
              Revoke Consent
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  trackingInfo: {
    marginTop: 8,
  },
  locationInfo: {
    marginTop: 8,
  },
  noLocationText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  actionButtons: {
    marginTop: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  settingsButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  revokeButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  settingsButtonText: {
    color: '#007AFF',
  },
  revokeButtonText: {
    color: '#dc3545',
  },
});

export default TrackingScreen;
