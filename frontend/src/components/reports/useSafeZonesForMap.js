import { useEffect, useState } from "react";
import safeZoneApi from "../../services/safeZoneApi";

// Encapsulates fetching + basic filtering logic for map safe zones.
export function useSafeZonesForMap() {
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchSafeZones() {
      try {
        setLoading(true);
        setError("");
        const data = await safeZoneApi.getAllSafeZones();
        if (!isMounted) return;
        setSafeZones(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err?.response?.data?.message || "Failed to load safe zones for map",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSafeZones();
    return () => {
      isMounted = false;
    };
  }, []);

  return { safeZones, loading, error };
}
