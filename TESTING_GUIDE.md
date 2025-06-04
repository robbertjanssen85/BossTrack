# 📱 BossTrack iPhone Testing Guide

## Current Status
✅ App built and installed on iPhone  
✅ Metro bundler running  
✅ Supabase connection configured  
✅ Environment variables loaded  

## Testing Steps

### 1. 🔧 Open Development Tools
On your iPhone with BossTrack app open:
- **Shake the device** OR **press volume buttons rapidly**
- Select **"Enable Live Reload"** from Dev Menu
- Select **"Remote JS Debugging"** to see console logs in Safari

### 2. 📱 Basic App Testing
1. **Open BossTrack app** on your iPhone
2. Check console logs (Safari Dev Tools if enabled)
3. **Complete consent form** with your details
4. Verify you reach the tracking screen

### 3. 🗄️ Database Monitoring
In Terminal, run the live monitor:
```bash
cd /Users/robbertjanssen/Documents/dev/TrackBoss/BossTrack
node monitor-live.js
```
This will show real-time data as it flows into Supabase.

### 4. 📍 GPS Testing
1. **Tap "Start Tracking"** in the app
2. **Walk around** for 2-3 minutes (indoor is fine)
3. Watch the monitor for GPS data updates
4. **Tap "Stop Tracking"** 
5. Check if trip data is saved

### 5. 🔍 Data Verification
Check Supabase dashboard:
- Go to https://supabase.com/dashboard
- Select your project
- Check `trips` and `locations` tables
- Verify GPS coordinates are being stored

## Expected Console Logs
Look for these messages in the app:
```
🏁 Simple App mounted, initializing...
📱 Environment check:
✅ Session restored for user: [user-id]
📍 Starting location tracking...
📤 GPS data uploaded: [coordinates]
```

## Troubleshooting

### If app doesn't start:
- Check Metro bundler is running (port 8081)
- Reload app by shaking device → "Reload"

### If no GPS data:
- Check location permissions in iOS Settings
- Ensure you're moving (even slightly)
- Check network connection

### If Supabase connection fails:
- Verify .env file has correct credentials
- Check network/firewall settings
- Run: `node test-supabase-connection-simple.js`

## Success Criteria
✅ App opens and shows consent screen  
✅ User can authenticate  
✅ Location permissions granted  
✅ GPS tracking starts/stops  
✅ Data appears in monitor-live.js  
✅ Trip data saved to Supabase  

## Next Steps After Success
- Test with longer trips (driving)
- Verify background location tracking
- Test app lifecycle (foreground/background)
- Performance testing with extended tracking

---

**Monitor Command:**
```bash
node monitor-live.js
```

**Reload App:** Shake iPhone → "Reload"
**View Logs:** Shake iPhone → "Remote JS Debugging"
