import Foundation
import CoreLocation
import React

@objc(LocationTracker)
class LocationTracker: RCTEventEmitter, CLLocationManagerDelegate {
    
    private var locationManager: CLLocationManager!
    private var isTracking = false
    private var trackingTimer: Timer?
    private var lastKnownLocation: CLLocation?
    
    override init() {
        super.init()
        setupLocationManager()
    }
    
    // MARK: - Setup
    
    private func setupLocationManager() {
        locationManager = CLLocationManager()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 1.0 // 1 meter minimum distance
        
        // Background location tracking
        if #available(iOS 9.0, *) {
            locationManager.allowsBackgroundLocationUpdates = true
        }
        locationManager.pausesLocationUpdatesAutomatically = false
    }
    
    // MARK: - React Native Bridge Methods
    
    @objc
    func startTracking(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            guard !self.isTracking else {
                resolve(["status": "already_tracking"])
                return
            }
            
            // Check authorization status
            let authStatus = self.locationManager.authorizationStatus
            guard authStatus == .authorizedAlways || authStatus == .authorizedWhenInUse else {
                reject("PERMISSION_DENIED", "Location permission not granted", nil)
                return
            }
            
            self.isTracking = true
            self.locationManager.startUpdatingLocation()
            
            // Start 1Hz timer for consistent GPS sampling
            self.trackingTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
                self.requestLocationUpdate()
            }
            
            resolve(["status": "started", "frequency": "1Hz"])
        }
    }
    
    @objc
    func stopTracking(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            guard self.isTracking else {
                resolve(["status": "not_tracking"])
                return
            }
            
            self.isTracking = false
            self.locationManager.stopUpdatingLocation()
            self.trackingTimer?.invalidate()
            self.trackingTimer = nil
            
            resolve(["status": "stopped"])
        }
    }
    
    @objc
    func requestLocationPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            let authStatus = self.locationManager.authorizationStatus
            
            switch authStatus {
            case .notDetermined:
                self.locationManager.requestAlwaysAuthorization()
                resolve(["status": "requested"])
            case .denied, .restricted:
                reject("PERMISSION_DENIED", "Location permission denied or restricted", nil)
            case .authorizedWhenInUse:
                self.locationManager.requestAlwaysAuthorization()
                resolve(["status": "when_in_use_only"])
            case .authorizedAlways:
                resolve(["status": "authorized"])
            @unknown default:
                reject("UNKNOWN_STATUS", "Unknown authorization status", nil)
            }
        }
    }
    
    @objc
    func getLocationPermissionStatus(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let authStatus = locationManager.authorizationStatus
        let statusString: String
        
        switch authStatus {
        case .notDetermined:
            statusString = "not_determined"
        case .denied:
            statusString = "denied"
        case .restricted:
            statusString = "restricted"
        case .authorizedWhenInUse:
            statusString = "when_in_use"
        case .authorizedAlways:
            statusString = "always"
        @unknown default:
            statusString = "unknown"
        }
        
        resolve(["status": statusString])
    }
    
    @objc
    func getCurrentLocation(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard locationManager.authorizationStatus == .authorizedAlways || locationManager.authorizationStatus == .authorizedWhenInUse else {
            reject("PERMISSION_DENIED", "Location permission not granted", nil)
            return
        }
        
        if let location = lastKnownLocation {
            let locationData = formatLocationData(location)
            resolve(locationData)
        } else {
            locationManager.requestLocation()
            // Result will be handled in delegate methods
        }
    }
    
    // MARK: - Private Methods
    
    private func requestLocationUpdate() {
        guard isTracking else { return }
        locationManager.requestLocation()
    }
    
    private func formatLocationData(_ location: CLLocation) -> [String: Any] {
        return [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "altitude": location.altitude,
            "accuracy": location.horizontalAccuracy,
            "bearing": location.course >= 0 ? location.course : NSNull(),
            "speed": location.speed >= 0 ? location.speed : NSNull(),
            "timestamp": ISO8601DateFormatter().string(from: location.timestamp)
        ]
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        lastKnownLocation = location
        let locationData = formatLocationData(location)
        
        // Send location update to React Native
        sendEvent(withName: "LocationUpdate", body: locationData)
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        let errorData: [String: Any] = [
            "error": error.localizedDescription,
            "code": (error as NSError).code
        ]
        
        sendEvent(withName: "LocationError", body: errorData)
    }
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        let statusString: String
        
        switch status {
        case .notDetermined:
            statusString = "not_determined"
        case .denied:
            statusString = "denied"
        case .restricted:
            statusString = "restricted"
        case .authorizedWhenInUse:
            statusString = "when_in_use"
        case .authorizedAlways:
            statusString = "always"
        @unknown default:
            statusString = "unknown"
        }
        
        let authData: [String: Any] = [
            "status": statusString,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]
        
        sendEvent(withName: "AuthorizationChanged", body: authData)
    }
    
    // MARK: - RCTEventEmitter
    
    override func supportedEvents() -> [String]! {
        return ["LocationUpdate", "LocationError", "AuthorizationChanged"]
    }
    
    override class func requiresMainQueueSetup() -> Bool {
        return true
    }
}
