#!/usr/bin/env node

/**
 * Test script to validate the consent flow and debug empty profile issue
 */

console.log('🧪 Testing consent flow and profile creation...\n');

// Simulate the ConsentData structure
const mockConsentData = {
  driverName: 'Test Driver',
  licenseNumber: 'ABC123',
  vehiclePlate: 'TEST-001',
  vehicleType: 'van',
  email: 'test@bosstrack.app',
  companyName: 'Test Company',
  phone: '+1-555-0123'
};

console.log('📋 Mock ConsentData:');
console.log(JSON.stringify(mockConsentData, null, 2));

// Simulate the profile creation logic from SimpleAuthService
const email = mockConsentData.email || `driver-${Date.now()}@bosstrack.app`;
const mockUserId = `user_${Date.now()}`;

const profile = {
  id: mockUserId,
  email: email,
  fullName: mockConsentData.driverName,
  companyName: mockConsentData.companyName,
  phone: mockConsentData.phone,
  consentGiven: true,
  consentTimestamp: new Date().toISOString(),
};

console.log('\n🔨 Built profile object:');
console.log(JSON.stringify(profile, null, 2));

// Check for empty profile scenario
const isEmptyProfile = Object.keys(profile).length === 0 || 
                      profile === null || 
                      profile === undefined ||
                      (typeof profile === 'object' && Object.values(profile).every(val => val === undefined));

console.log('\n🔍 Profile validation:');
console.log('- Is empty profile:', isEmptyProfile);
console.log('- Profile type:', typeof profile);
console.log('- Profile keys count:', Object.keys(profile).length);
console.log('- Has required id:', !!profile.id);
console.log('- Has fullName:', !!profile.fullName);
console.log('- Has email:', !!profile.email);

// Simulate database field mapping
const cleanProfile = {
  id: profile.id,
  email: profile.email || null,
  full_name: profile.fullName || null,
  company_name: profile.companyName || null,
  phone: profile.phone || null,
  consent_given: profile.consentGiven === true,
  consent_timestamp: profile.consentTimestamp || new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

console.log('\n🧹 Clean profile for database:');
console.log(JSON.stringify(cleanProfile, null, 2));

// Test empty field handling
console.log('\n⚠️  Testing edge cases:');

// Test with missing driverName
const emptyConsentData = { ...mockConsentData, driverName: '' };
console.log('Empty driverName consent data:', JSON.stringify(emptyConsentData, null, 2));

// Test with undefined values
const undefinedConsentData = {
  driverName: undefined,
  vehiclePlate: undefined,
  vehicleType: 'van'
};
console.log('Undefined values consent data:', JSON.stringify(undefinedConsentData, null, 2));

console.log('\n✅ Test complete - check logs for any data flow issues');
