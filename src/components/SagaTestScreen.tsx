import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { sagaActions } from '../sagas/index';
import { setScreen } from '../store/slices/uiSlice';

const SagaTestScreen: React.FC = () => {
  const dispatch = useDispatch();

  const handleBack = () => {
    dispatch(setScreen('settings'));
  };

  const testSagas = [
    {
      name: 'Initialize Session',
      action: () => {
        console.log('🧪 Testing: Initialize Session Saga');
        dispatch(sagaActions.initializeSession());
      },
    },
    {
      name: 'Request Location Permission',
      action: () => {
        console.log('🧪 Testing: Request Location Permission Saga');
        dispatch(sagaActions.requestLocationPermission());
      },
    },
    {
      name: 'Start Tracking',
      action: () => {
        console.log('🧪 Testing: Start Tracking Saga');
        dispatch(sagaActions.startTracking());
      },
    },
    {
      name: 'Stop Tracking',
      action: () => {
        console.log('🧪 Testing: Stop Tracking Saga');
        dispatch(sagaActions.stopTracking());
      },
    },
    {
      name: 'Upload Trip Data',
      action: () => {
        console.log('🧪 Testing: Upload Trip Data Saga');
        dispatch(sagaActions.uploadTripData());
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Redux-Saga Test</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <Text style={styles.subtitle}>
        Tap buttons to test saga actions. Check console for logs.
      </Text>
      
      <ScrollView style={styles.scrollView}>
        {testSagas.map((test, index) => (
          <TouchableOpacity
            key={index}
            style={styles.button}
            onPress={test.action}
          >
            <Text style={styles.buttonText}>{test.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <Text style={styles.instructions}>
        Open React Native debugger or check Metro logs to see saga execution
      </Text>
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
  headerSpacer: {
    width: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 12,
    textAlign: 'center',
    color: '#999',
    margin: 20,
  },
});

export default SagaTestScreen;
