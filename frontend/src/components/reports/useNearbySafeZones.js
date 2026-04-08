import { useEffect, useState } from "react";
import safeZoneApi from "../../services/safeZoneApi";

// Hook to fetch nearby safe zones based on user's location
export function useNearbySafeZones(
  latitude,
  longitude,
  maxDistance = 5000 // 5km in meters
) {
  const [nearbySafeZones, setNearbySafeZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (latitude === null || longitude === null || latitude === undefined || longitude === undefined) {
      setNearbySafeZones([]);
      return;
    }

    const fetchNearbySafeZones = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await safeZoneApi.getNearbySafeZones(
          latitude,
          longitude,
          maxDistance,
          10 // Get up to 10 nearby zones
        );
        setNearbySafeZones(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err?.response?.data?.message || "Failed to load nearby safe zones"
        );
        setNearbySafeZones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbySafeZones();
  }, [latitude, longitude, maxDistance]);

  return { nearbySafeZones, loading, error };
}

// Helper function to calculate distance between two points (Haversine formula)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}
