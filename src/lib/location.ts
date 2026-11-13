import { SHOP_LOCATION, SHOP_ATTENDANCE_RADIUS_METERS } from "./constants";

/**
 * Calculate distance between 2 GPS coordinates using Haversine formula
 * @returns distance in meters (rounded to 1 decimal)
 */
export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Check if given location is within shop radius
 * Uses SHOP_LOCATION and SHOP_ATTENDANCE_RADIUS_METERS from constants
 */
export function isWithinShopRadius(
  lat: number,
  lon: number
): { isWithin: boolean; distance: number } {
  const distance = getDistanceInMeters(
    lat,
    lon,
    SHOP_LOCATION.latitude,
    SHOP_LOCATION.longitude
  );

  return {
    isWithin: distance <= SHOP_ATTENDANCE_RADIUS_METERS,
    distance,
  };
}

/**
 * Browser geolocation wrapper (Promise-based)
 * Handles: permission denied, timeout, GPS unavailable
 * Timeout: 15 seconds
 * Accuracy: high
 */
export function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser or device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let message = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied. Please allow GPS access in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable. Please check your GPS signal.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out. Please try again.";
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}
