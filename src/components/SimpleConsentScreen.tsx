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
import { authService, ConsentData } from '../services/AuthService';

interface ConsentScreenProps {
  onAuthenticate: (user: any) => void;
}

const ConsentScreen: React.FC<ConsentScreenProps> = ({ onAuthenticate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleType, setVehicleType] = useState<'van' | 'truck' | 'other'>('van');
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const handleGiveConsent = async () => {
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

    setIsLoading(true);

    try {
      // Prepare consent data
      const consentData: ConsentData = {
        driverName: driverName.trim(),
        licenseNumber: licenseNumber.trim(),
        vehiclePlate: vehiclePlate.toUpperCase().trim(),
        vehicleType,
        email: email.trim() || undefined,
        companyName: companyName.trim() || undefined,
        phone: phone.trim() || undefined,
      };

      console.log('🔐 Registering user with consent:', consentData);

      // Register user with AuthService
      const user = await authService.registerWithConsent(consentData);

      console.log('✅ User authenticated successfully:', user.id);
      
      // Call parent callback with user data
      onAuthenticate(user);

    } catch (error) {
      console.error('❌ Authentication failed:', error);
      Alert.alert(
        'Authentication Failed', 
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
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
          <Text style={styles.title}>BossTrack</Text>
          <Text style={styles.subtitle}>Location Tracking Consent</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Driver Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={driverName}
              onChangeText={setDriverName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Driver's License Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your license number (optional)"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              autoCapitalize="characters"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle License Plate *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter vehicle license plate"
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
              autoCapitalize="characters"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.radioGroup}>
              {(['van', 'truck', 'other'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.radioItem}
                  onPress={() => setVehicleType(type)}
                >
                  <View style={[
                    styles.radioCircle,
                    vehicleType === type && styles.radioSelected
                  ]} />
                  <Text style={styles.radioText}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email (optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter company name (optional)"
              value={companyName}
              onChangeText={setCompanyName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number (optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </View>

          <View style={styles.termsSection}>
            <TouchableOpacity
              style={styles.termsButton}
              onPress={showTermsAndConditions}
            >
              <Text style={styles.termsButtonText}>
                📋 Read Terms and Conditions
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setHasReadTerms(!hasReadTerms)}
            >
              <View style={[
                styles.checkbox,
                hasReadTerms && styles.checkboxChecked
              ]}>
                {hasReadTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                I have read and agree to the terms and conditions *
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.consentButton,
              (!driverName.trim() || !vehiclePlate.trim() || !hasReadTerms || isLoading) && 
              styles.consentButtonDisabled
            ]}
            onPress={handleGiveConsent}
            disabled={!driverName.trim() || !vehiclePlate.trim() || !hasReadTerms || isLoading}
          >
            <Text style={[
              styles.consentButtonText,
              (!driverName.trim() || !vehiclePlate.trim() || !hasReadTerms || isLoading) && 
              styles.consentButtonTextDisabled
            ]}>
              {isLoading ? '🔄 Processing...' : '✅ Give Consent & Start Tracking'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            * Required fields
          </Text>
          <Text style={styles.disclaimerSubtext}>
            Your location will be tracked with high precision for operational purposes.
            You can revoke consent at any time through the app settings.
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
  form: {
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 10,
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
    borderColor: '#3498db',
    backgroundColor: '#3498db',
  },
  radioText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  termsSection: {
    marginBottom: 20,
  },
  termsButton: {
    backgroundColor: '#ecf0f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  termsButtonText: {
    fontSize: 16,
    color: '#3498db',
    textAlign: 'center',
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#27ae60',
    backgroundColor: '#27ae60',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    lineHeight: 20,
  },
  consentButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  consentButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  consentButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  consentButtonTextDisabled: {
    color: '#ecf0f1',
  },
  footer: {
    paddingTop: 20,
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: '#e74c3c',
    marginBottom: 8,
    textAlign: 'center',
  },
  disclaimerSubtext: {
    fontSize: 11,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default ConsentScreen;
