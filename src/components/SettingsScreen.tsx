import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setScreen, showNotification } from '../store/slices/uiSlice';
import { setLicensePlate, registerVehicle } from '../store/slices/vehicleSlice';
import { revokeConsent } from '../store/slices/authSlice';
import { sagaActions } from '../sagas/index';
import { apiService } from '../services/ApiService';

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { currentVehicle, licensePlate } = useSelector((state: RootState) => state.vehicle);
  const { sessionId, sessionExpiresAt, driverId } = useSelector((state: RootState) => state.auth);
  const { isTracking, locationPermissionStatus } = useSelector((state: RootState) => state.tracking);
  const { isLoading } = useSelector((state: RootState) => state.ui);
  
  const [newLicensePlate, setNewLicensePlate] = useState(licensePlate);
  const [vehicleType, setVehicleType] = useState<'van' | 'truck' | 'other'>(
    currentVehicle?.vehicleType || 'van'
  );
  const [vehicleMake, setVehicleMake] = useState(currentVehicle?.make || '');
  const [vehicleModel, setVehicleModel] = useState(currentVehicle?.model || '');
  const [apiUrl, setApiUrl] = useState(apiService.getBaseURL());
  
  const handleBack = () => {
    dispatch(setScreen('tracking'));
  };

  const handleUpdateVehicle = () => {
    if (!newLicensePlate.trim()) {
      Alert.alert('Error', 'Please enter a valid license plate');
      return;
    }

    const updatedVehicle = {
      vehicleId: currentVehicle?.vehicleId || `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      licensePlate: newLicensePlate.toUpperCase().trim(),
      vehicleType,
      make: vehicleMake.trim() || undefined,
      model: vehicleModel.trim() || undefined,
    };

    dispatch(setLicensePlate(newLicensePlate));
    dispatch(registerVehicle(updatedVehicle));
    
    dispatch(showNotification({
      message: 'Vehicle information updated successfully',
      type: 'success',
    }));
  };

  const handleRequestLocationPermission = () => {
    dispatch(sagaActions.requestLocationPermission());
  };

  const handleTestConnection = async () => {
    try {
      dispatch(showNotification({
        message: 'Testing API connection...',
        type: 'info',
      }));

      await apiService.healthCheck();
      
      dispatch(showNotification({
        message: 'API connection successful',
        type: 'success',
      }));
    } catch (error) {
      dispatch(showNotification({
        message: `API connection failed: ${error}`,
        type: 'error',
      }));
    }
  };

  const handleUpdateApiUrl = () => {
    try {
      const url = new URL(apiUrl);
      apiService.setBaseURL(apiUrl);
      
      dispatch(showNotification({
        message: 'API URL updated successfully',
        type: 'success',
      }));
    } catch (error) {
      Alert.alert('Error', 'Please enter a valid URL');
    }
  };

  const handleUploadQueuedData = () => {
    dispatch(sagaActions.uploadTripData());
    dispatch(showNotification({
      message: 'Uploading queued trip data...',
      type: 'info',
    }));
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPermissionStatusColor = (status: string) => {
    switch (status) {
      case 'always':
        return '#28a745';
      case 'when_in_use':
        return '#ffc107';
      case 'denied':
      case 'restricted':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Session Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Session ID:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {sessionId ? `...${sessionId.slice(-8)}` : 'No session'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Driver ID:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {driverId ? `...${driverId.slice(-8)}` : 'No driver'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Expires At:</Text>
              <Text style={styles.infoValue}>
                {sessionExpiresAt ? formatDate(sessionExpiresAt) : 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        {/* Vehicle Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>License Plate</Text>
              <TextInput
                style={styles.input}
                value={newLicensePlate}
                onChangeText={setNewLicensePlate}
                placeholder="Enter license plate"
                autoCapitalize="characters"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.radioGroup}>
                {(['van', 'truck', 'other'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.radioOption}
                    onPress={() => setVehicleType(type)}
                    disabled={isLoading}
                  >
                    <View style={[
                      styles.radioCircle,
                      vehicleType === type && styles.radioSelected
                    ]} />
                    <Text style={styles.radioLabel}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Make (Optional)</Text>
              <TextInput
                style={styles.input}
                value={vehicleMake}
                onChangeText={setVehicleMake}
                placeholder="e.g., Ford, Mercedes"
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Model (Optional)</Text>
              <TextInput
                style={styles.input}
                value={vehicleModel}
                onChangeText={setVehicleModel}
                placeholder="e.g., Transit, Sprinter"
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdateVehicle}
              disabled={isLoading}
            >
              <Text style={styles.updateButtonText}>Update Vehicle Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Settings</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Permission Status:</Text>
              <Text style={[
                styles.infoValue,
                { color: getPermissionStatusColor(locationPermissionStatus) }
              ]}>
                {locationPermissionStatus.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={handleRequestLocationPermission}
              disabled={isLoading}
            >
              <Text style={styles.permissionButtonText}>
                Request Location Permission
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* API Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Settings</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>API Base URL</Text>
              <TextInput
                style={styles.input}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="https://api.bosstrack.example.com/v1"
                autoCapitalize="none"
                keyboardType="url"
                editable={!isLoading}
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.updateButton]}
                onPress={handleUpdateApiUrl}
                disabled={isLoading}
              >
                <Text style={styles.updateButtonText}>Update URL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.testButton]}
                onPress={handleTestConnection}
                disabled={isLoading}
              >
                <Text style={styles.testButtonText}>Test Connection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUploadQueuedData}
              disabled={isLoading}
            >
              <Text style={styles.uploadButtonText}>Upload Queued Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.revokeButton}
              onPress={handleRevokeConsent}
              disabled={isLoading}
            >
              <Text style={styles.revokeButtonText}>Revoke Consent</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Version:</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Platform:</Text>
              <Text style={styles.infoValue}>iOS</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>GPS Frequency:</Text>
              <Text style={styles.infoValue}>1 Hz</Text>
            </View>
          </View>
        </View>

        {/* Developer Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Tools</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.developerButton}
              onPress={() => {
                console.log('🧪 Manual test: Dispatching initializeSession saga');
                dispatch(sagaActions.initializeSession());
              }}
              disabled={isLoading}
            >
              <Text style={styles.developerButtonText}>
                🧪 Test Initialize Session Saga
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.developerButton, { backgroundColor: '#28a745', marginTop: 10 }]}
              onPress={() => {
                console.log('🧪 Manual test: Dispatching requestLocationPermission saga');
                dispatch(sagaActions.requestLocationPermission());
              }}
              disabled={isLoading}
            >
              <Text style={styles.developerButtonText}>
                🧪 Test Location Permission Saga
              </Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 60,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
  },
  radioSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  updateButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  testButton: {
    backgroundColor: '#ffc107',
  },
  testButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#17a2b8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  revokeButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  revokeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  developerButton: {
    backgroundColor: '#6f42c1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  developerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
