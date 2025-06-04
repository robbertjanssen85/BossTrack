#!/usr/bin/env node

/**
 * Test script to validate the three authentication modes:
 * 1. Anonymous authentication
 * 2. Email/password registration
 * 3. Email/password sign-in
 */

const { simpleAuthService } = require('./src/services/SimpleAuthService');

async function testAuthenticationFlows() {
  console.log('🔬 Starting authentication flow tests...\n');

  // Test data
  const testConsentData = {
    driverName: 'Test Driver',
    vehiclePlate: 'TEST123',
    vehicleType: 'van',
    email: 'test@example.com',
    companyName: 'Test Company',
    phone: '+1234567890'
  };

  try {
    console.log('1️⃣ Testing Anonymous Authentication');
    console.log('=====================================');
    
    const anonymousUser = await simpleAuthService.registerAnonymouslyWithConsent({
      ...testConsentData,
      email: undefined // No email for anonymous
    });
    
    console.log('✅ Anonymous authentication successful:');
    console.log('   User ID:', anonymousUser.id);
    console.log('   Is Anonymous:', anonymousUser.isAnonymous);
    console.log('   Driver Name:', anonymousUser.fullName);
    console.log('   Consent:', anonymousUser.consentGiven);
    console.log('');

    // Sign out before next test
    await simpleAuthService.signOut();
    console.log('🚪 Signed out anonymous user\n');

  } catch (error) {
    console.error('❌ Anonymous authentication failed:', error.message);
    console.log('');
  }

  try {
    console.log('2️⃣ Testing Email/Password Registration');
    console.log('=====================================');
    
    const registeredUser = await simpleAuthService.registerWithConsent(testConsentData);
    
    console.log('✅ Email/password registration successful:');
    console.log('   User ID:', registeredUser.id);
    console.log('   Email:', registeredUser.email);
    console.log('   Driver Name:', registeredUser.fullName);
    console.log('   Consent:', registeredUser.consentGiven);
    console.log('');

    // Sign out before next test
    await simpleAuthService.signOut();
    console.log('🚪 Signed out registered user\n');

  } catch (error) {
    console.error('❌ Email/password registration failed:', error.message);
    console.log('');
  }

  try {
    console.log('3️⃣ Testing Email/Password Sign-in');
    console.log('=================================');
    
    // Try to sign in with the previously registered user
    // Note: In mock mode, this won't find the actual user, but we can test the flow
    const signedInUser = await simpleAuthService.signIn('test@example.com', 'mock_password');
    
    console.log('✅ Email/password sign-in successful:');
    console.log('   User ID:', signedInUser.id);
    console.log('   Email:', signedInUser.email);
    console.log('   Driver Name:', signedInUser.fullName);
    console.log('');

    // Sign out after test
    await simpleAuthService.signOut();
    console.log('🚪 Signed out signed-in user\n');

  } catch (error) {
    console.error('❌ Email/password sign-in failed:', error.message);
    console.log('');
  }

  console.log('🏁 Authentication flow tests completed!');
}

// Run the tests
testAuthenticationFlows()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  });
