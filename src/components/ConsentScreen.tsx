import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';

interface ConsentScreenProps {
  onAuthenticate: () => void;
}

const ConsentScreen: React.FC<ConsentScreenProps> = ({ onAuthenticate }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const [driverName, setDriverName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState(licensePlate);
  const [vehicleType, setVehicleType] = useState<'van' | 'truck' | 'other'>('van');
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const handleGiveConsent = () => {
    // Validation
    if (!driverName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    if (!vehiclePlate.trim()) {
      Alert.alert('Error', 'Please enter the vehicle license plate');
      return;
    }
    
    if (!hasReadTerms) {
      Alert.alert('Error', 'Please read and accept the terms and conditions');
      return;
    }

    // Generate session ID and driver ID
    const sessionId = uuidv4();
    const driverId = `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update vehicle information
    const vehicle = {
      vehicleId: `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      licensePlate: vehiclePlate.toUpperCase().trim(),
      vehicleType,
    };
    
    dispatch(setLicensePlate(vehiclePlate));
    dispatch(registerVehicle(vehicle));
    
    // Give consent
    dispatch(giveConsent({ driverId, sessionId }));
    
    // Request location permission
    dispatch(sagaActions.requestLocationPermission());
    
    // Navigate to tracking screen
    dispatch(setScreen('tracking'));
    
    dispatch(showNotification({
      message: 'Consent granted successfully. You can now start tracking.',
      type: 'success',
    }));
  };

  const showTermsAndConditions = () => {
    Alert.alert(
      'Terms and Conditions',
      `BossTrack Location Tracking Consent

By using this application, you agree to:

1. Location Data Collection: Your precise location will be continuously tracked at 1Hz (once per second) while the app is active.

2. Data Usage: Location data will be associated with your vehicle information and uploaded to secure servers for mission tracking purposes.

3. Data Retention: Trip data will be stored for operational analysis and may be retained according to company policy.

4. Consent Duration: This consent is valid for 24 hours from the time granted. You can revoke consent at any time.

5. Revocation: You can stop tracking and revoke consent through the app settings.

6. Background Tracking: The app will continue tracking your location even when running in the background.

Do you understand and agree to these terms?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'I Agree', 
          onPress: () => setHasReadTerms(true),
          style: 'default'
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>BossTrack Consent</Text>
          <Text style={styles.subtitle}>
            Please provide your information and consent to location tracking
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Driver Name *</Text>
            <TextInput
              style={styles.input}
              value={driverName}
              onChangeText={setDriverName}
              placeholder="Enter your full name"
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Driver License Number (Optional)</Text>
            <TextInput
              style={styles.input}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="Enter license number"
              autoCapitalize="characters"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle License Plate *</Text>
            <TextInput
              style={styles.input}
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
              placeholder="Enter license plate (e.g., ABC-123)"
              autoCapitalize="characters"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Type *</Text>
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

          <View style={styles.consentSection}>
            <TouchableOpacity
              style={styles.termsButton}
              onPress={showTermsAndConditions}
              disabled={isLoading}
            >
              <Text style={styles.termsButtonText}>
                Read Terms and Conditions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setHasReadTerms(!hasReadTerms)}
              disabled={isLoading}
            >
              <View style={[
                styles.checkbox,
                hasReadTerms && styles.checkboxChecked
              ]}>
                {hasReadTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I have read and agree to the terms and conditions
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.consentButton,
              (!hasReadTerms || isLoading) && styles.consentButtonDisabled
            ]}
            onPress={handleGiveConsent}
            disabled={!hasReadTerms || isLoading}
          >
            <Text style={[
              styles.consentButtonText,
              (!hasReadTerms || isLoading) && styles.consentButtonTextDisabled
            ]}>
              {isLoading ? 'Processing...' : 'Give Consent & Start Tracking'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This consent is valid for 24 hours and can be revoked at any time.
          </Text>
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
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
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
  consentSection: {
    marginTop: 20,
  },
  termsButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  termsButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  consentButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  consentButtonDisabled: {
    backgroundColor: '#ccc',
  },
  consentButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  consentButtonTextDisabled: {
    color: '#999',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ConsentScreen;
