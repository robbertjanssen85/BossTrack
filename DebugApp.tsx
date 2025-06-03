import React from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  SafeAreaView,
} from 'react-native';
import { Provider } from 'react-redux';
import { debugStore } from './src/store/debugStore';

// Simple test component
const TestContent: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.content}>
        <Text style={styles.title}>🚀 BossTrack Debug</Text>
        <Text style={styles.subtitle}>Redux Store Connected</Text>
        <Text style={styles.info}>If you see this, Redux is working!</Text>
      </View>
    </SafeAreaView>
  );
};

const DebugApp: React.FC = () => {
  return (
    <Provider store={debugStore}>
      <TestContent />
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
});

export default DebugApp;
