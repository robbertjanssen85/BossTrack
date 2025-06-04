// Diagnostic screen to debug app state
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { simpleAuthService } from '../services/SimpleAuthService';
import { simpleTripService } from '../services/SimpleTripService';
import { locationService } from '../services/LocationService';
import { Config } from '../config/environment';

interface DiagnosticScreenProps {
  onNavigateBack?: () => void;
}

const DiagnosticScreen: React.FC<DiagnosticScreenProps> = ({ onNavigateBack }) => {
  const [diagnosticData, setDiagnosticData] = useState<{
    user: any;
    hasConsent: boolean;
    currentTrip: any;
    locationPermission: string;
    locationServiceAvailable: boolean;
    environmentCheck: {
      supabaseUrl: boolean;
      supabaseKey: boolean;
    };
    lastError: string | null;
  }>({
    user: null,
    hasConsent: false,
    currentTrip: null,
    locationPermission: 'unknown',
    locationServiceAvailable: false,
    environmentCheck: {
      supabaseUrl: false,
      supabaseKey: false,
    },
    lastError: null,
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    console.log('🔍 Running app diagnostics...');
    
    try {
      // Check environment
      const envCheck = {
        supabaseUrl: !!Config.SUPABASE_URL && Config.SUPABASE_URL !== 'default',
        supabaseKey: !!Config.SUPABASE_ANON_KEY && Config.SUPABASE_ANON_KEY !== 'default',
      };

      // Check auth state
      const user = simpleAuthService.getCurrentUser();
      const hasConsent = simpleAuthService.hasValidConsent();

      // Check trip state
      const currentTrip = simpleTripService.getCurrentTrip();

      // Check location service
      const locationServiceAvailable = locationService.isLocationServiceAvailable();
      let locationPermission = 'unknown';
      
      if (locationServiceAvailable) {
        try {
          const permissionResult = await locationService.getLocationPermissionStatus();
          locationPermission = permissionResult.status;
        } catch (error) {
          console.warn('Could not get location permission:', error);
        }
      }

      setDiagnosticData({
        user,
        hasConsent,
        currentTrip,
        locationPermission,
        locationServiceAvailable,
        environmentCheck: envCheck,
        lastError: null,
      });

      console.log('✅ Diagnostics complete:', {
        user: !!user,
        hasConsent,
        currentTrip: !!currentTrip,
        locationPermission,
        locationServiceAvailable,
        envCheck,
      });

    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDiagnosticData(prev => ({
        ...prev,
        lastError: errorMessage,
      }));
    }
  };

  const testUserCreation = async () => {
    try {
      console.log('🧪 Testing user creation...');
      
      // Create a simple test user with consent
      const testConsent = {
        driverName: 'Test Driver',
        vehiclePlate: 'TEST-123',
        vehicleType: 'van' as const,
        email: `test-${Date.now()}@diagnostics.com`,
      };
      
      const testUser = await simpleAuthService.registerWithConsent(testConsent);
      
      Alert.alert('Success', `Test user created: ${testUser?.id || 'unknown'}`);
      runDiagnostics();
      
    } catch (error) {
      console.error('❌ User creation test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `User creation failed: ${errorMessage}`);
    }
  };

  const testTripCreation = async () => {
    try {
      console.log('🧪 Testing trip creation...');
      
      const trip = await simpleTripService.startTrip({ plate: 'TEST-123', type: 'van' });
      
      Alert.alert('Success', `Test trip created: ${trip.id}`);
      runDiagnostics();
      
    } catch (error) {
      console.error('❌ Trip creation test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Trip creation failed: ${errorMessage}`);
    }
  };

  const testLocationPermission = async () => {
    try {
      console.log('🧪 Testing location permission...');
      
      const result = await locationService.requestLocationPermission();
      
      Alert.alert('Result', `Permission: ${result.status}`);
      runDiagnostics();
      
    } catch (error) {
      console.error('❌ Location permission test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Permission test failed: ${errorMessage}`);
    }
  };

  const getStatusIcon = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? '✅' : '❌';
    }
    switch (status) {
      case 'granted': return '✅';
      case 'denied': return '❌';
      case 'restricted': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => onNavigateBack && onNavigateBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🔍 App Diagnostics</Text>
        </View>
        
        {/* Environment Check */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌍 Environment</Text>
          <Text style={styles.item}>
            {getStatusIcon(diagnosticData.environmentCheck.supabaseUrl)} Supabase URL
          </Text>
          <Text style={styles.item}>
            {getStatusIcon(diagnosticData.environmentCheck.supabaseKey)} Supabase Key
          </Text>
        </View>

        {/* Auth State */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Authentication</Text>
          <Text style={styles.item}>
            {getStatusIcon(!!diagnosticData.user)} User Logged In
          </Text>
          <Text style={styles.item}>
            {getStatusIcon(diagnosticData.hasConsent)} Valid Consent
          </Text>
          {diagnosticData.user && (
            <Text style={styles.detail}>User ID: {diagnosticData.user.id}</Text>
          )}
        </View>

        {/* Trip State */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Trip Service</Text>
          <Text style={styles.item}>
            {getStatusIcon(!!diagnosticData.currentTrip)} Active Trip
          </Text>
          {diagnosticData.currentTrip && (
            <Text style={styles.detail}>Trip ID: {diagnosticData.currentTrip.id}</Text>
          )}
        </View>

        {/* Location Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location Service</Text>
          <Text style={styles.item}>
            {getStatusIcon(diagnosticData.locationServiceAvailable)} Service Available
          </Text>
          <Text style={styles.item}>
            {getStatusIcon(diagnosticData.locationPermission)} Permission: {diagnosticData.locationPermission}
          </Text>
        </View>

        {/* Error Display */}
        {diagnosticData.lastError && (
          <View style={styles.errorSection}>
            <Text style={styles.errorTitle}>❌ Last Error</Text>
            <Text style={styles.errorText}>{diagnosticData.lastError}</Text>
          </View>
        )}

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Tests</Text>
          
          <TouchableOpacity style={styles.button} onPress={testUserCreation}>
            <Text style={styles.buttonText}>Test User Creation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={testTripCreation}>
            <Text style={styles.buttonText}>Test Trip Creation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={testLocationPermission}>
            <Text style={styles.buttonText}>Test Location Permission</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.refreshButton]} 
            onPress={runDiagnostics}
          >
            <Text style={styles.buttonText}>🔄 Refresh Diagnostics</Text>
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
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2196f3',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  item: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  detail: {
    fontSize: 14,
    color: '#888',
    marginLeft: 20,
    fontFamily: 'monospace',
  },
  errorSection: {
    backgroundColor: '#ffebee',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#4caf50',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DiagnosticScreen;
