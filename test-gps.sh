#!/bin/bash
# GPS Testing Script for BossTrack

echo "🚀 BossTrack GPS Testing Script"
echo "================================"

# Check if the app is running
if ! pgrep -f "Simulator" > /dev/null; then
    echo "⚠️  iOS Simulator not running. Starting simulator..."
    open -a Simulator
    sleep 5
fi

echo "📱 Launching BossTrack with GPS integration..."

cd /Users/robbertjanssen/Documents/dev/TrackBoss/BossTrack

# Clean build for GPS testing
echo "🧹 Cleaning build cache..."
npx react-native clean

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build and run
echo "🔨 Building and launching app..."
npx react-native run-ios --simulator "iPhone 16"

echo ""
echo "🎯 GPS Testing Instructions:"
echo "----------------------------"
echo "1. Open the app on simulator"
echo "2. Go to Settings screen"
echo "3. Check GPS Status section"
echo "4. Test GPS permission button"
echo "5. Test GPS location button"
echo "6. Start tracking to see GPS in action"
echo ""
echo "📍 Location Simulation:"
echo "In iOS Simulator, go to:"
echo "Device > Location > Custom Location..."
echo "Enter coordinates like: 37.7749, -122.4194 (San Francisco)"
echo ""
echo "🔧 Troubleshooting:"
echo "- If GPS not working: Check iOS simulator location settings"
echo "- If app crashes: Check Metro bundler console for errors"
echo "- If permissions fail: Reset iOS simulator content and settings"
