import { useEffect, useState } from "react";
import safeZoneApi from "../../services/safeZoneApi";
import { useNearbySafeZones, calculateDistance } from "./useNearbySafeZones";
import { ReportsMap } from "./ReportsMap";

const CitizenSafeZoneView = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [locError, setLocError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [allSafeZones, setAllSafeZones] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedZoneId, setExpandedZoneId] = useState(null);
  const [zoneWeatherData, setZoneWeatherData] = useState({});
  const [loadingWeatherId, setLoadingWeatherId] = useState(null);

  // Fetch nearby zones if location is available
  const { nearbySafeZones, loading: loadingNearby } = useNearbySafeZones(
    userLocation?.latitude ?? null,
    userLocation?.longitude ?? null,
    5000 // 5km
  );

  // Get user's geolocation on mount
  useEffect(() => {
    setGettingLocation(true);
    setLocError("");

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setGettingLocation(false);
        },
        (error) => {
          setLocError(
            "Unable to get your location. Showing all safe zones instead."
          );
          setGettingLocation(false);
          // Fetch all zones as fallback
          fetchAllSafeZones();
        }
      );
    } else {
      setLocError("Geolocation not supported. Showing all safe zones instead.");
      setGettingLocation(false);
      fetchAllSafeZones();
    }
  }, []);

  // Fetch all safe zones as fallback or if geolocation denied
  const fetchAllSafeZones = async () => {
    setLoadingAll(true);
    try {
      const data = await safeZoneApi.getAllSafeZones();
      setAllSafeZones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load safe zones:", err);
      setAllSafeZones([]);
    } finally {
      setLoadingAll(false);
    }
  };

  // Fetch all zones if no location available
  useEffect(() => {
    if (!gettingLocation && !userLocation) {
      fetchAllSafeZones();
    }
  }, [gettingLocation, userLocation]);

  // Calculate distance for each nearby zone
  const zonesWithDistance = nearbySafeZones.map((zone) => ({
    ...zone,
    distance:
      userLocation && zone.location
        ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            zone.location.coordinates[1],
            zone.location.coordinates[0]
          )
        : null,
  }));

  // Sort by distance
  const sortedNearbyZones = [...zonesWithDistance].sort(
    (a, b) => (a.distance || Infinity) - (b.distance || Infinity)
  );

  // Determine which zones to display
  const displayZones =
    userLocation && sortedNearbyZones.length > 0 ? sortedNearbyZones : allSafeZones;

  // Filter zones by type
  const filteredZones =
    activeFilter === "all"
      ? displayZones
      : displayZones.filter((zone) => zone.type === activeFilter);

  // Handle weather check
  const handleCheckWeather = async (zoneId) => {
    // If already expanded, collapse it
    if (expandedZoneId === zoneId) {
      setExpandedZoneId(null);
      return;
    }

    // If weather data already exists, just toggle expansion
    if (zoneWeatherData[zoneId]) {
      setExpandedZoneId(zoneId);
      return;
    }

    // Otherwise fetch weather data
    setLoadingWeatherId(zoneId);
    try {
      const response = await safeZoneApi.getSafeZoneWeather(zoneId);
      setZoneWeatherData((prev) => ({
        ...prev,
        [zoneId]: response,
      }));
      setExpandedZoneId(zoneId);
    } catch (err) {
      console.error("Failed to get weather data:", err);
      alert("Failed to get weather data");
    } finally {
      setLoadingWeatherId(null);
    }
  };

  const zoneTypes = [
    ...new Set(displayZones.map((zone) => zone.type).filter(Boolean)),
  ];

  if (gettingLocation) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Getting your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Safe Zones Near You
        </h2>
        {locError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            📍 {locError}
          </div>
        )}
        {userLocation && !locError && (
          <p className="text-sm text-gray-600">
            Showing zones near {userLocation.latitude.toFixed(4)},
            {userLocation.longitude.toFixed(4)}
          </p>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode("list")}
          className={`px-4 py-2 rounded font-medium transition ${
            viewMode === "list"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          📋 List View
        </button>
        <button
          onClick={() => setViewMode("map")}
          className={`px-4 py-2 rounded font-medium transition ${
            viewMode === "map"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          🗺️ Map View
        </button>
      </div>

      {/* Filters */}
      {viewMode === "list" && zoneTypes.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Type:
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                activeFilter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All Types
            </button>
            {zoneTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  activeFilter === type
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div>
          {loadingNearby && userLocation && (
            <p className="text-gray-600 text-center py-4">
              Loading nearby zones...
            </p>
          )}
          {loadingAll && !userLocation && (
            <p className="text-gray-600 text-center py-4">
              Loading safe zones...
            </p>
          )}

          {filteredZones.length === 0 && !loadingNearby && !loadingAll && (
            <p className="text-gray-600 text-center py-8">
              No safe zones found in your area.
            </p>
          )}

          <div className="space-y-4">
            {filteredZones.map((zone) => {
              const isExpanded = expandedZoneId === zone._id;
              const weatherData = zoneWeatherData[zone._id];
              const isLoading = loadingWeatherId === zone._id;

              return (
                <div
                  key={zone._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {zone.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Type: <span className="font-medium">{zone.type}</span>
                      </p>
                    </div>
                    {zone.distance && zone.distance !== null && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {(zone.distance || 0).toFixed(1)} km
                        </p>
                        <p className="text-xs text-gray-500">away</p>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700 text-sm mb-3">{zone.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    {zone.capacityPercentage && (
                      <div>
                        <p className="text-gray-600">Capacity</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              zone.capacityPercentage > 80
                                ? "bg-red-500"
                                : zone.capacityPercentage > 50
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(zone.capacityPercentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {zone.averageRating && (
                      <div>
                        <p className="text-gray-600">Rating</p>
                        <p className="font-semibold">
                          ⭐ {zone.averageRating.toFixed(1)}/5
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleCheckWeather(zone._id)}
                    disabled={isLoading}
                    className={`w-full py-2 rounded font-medium transition ${
                      isLoading
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    {isLoading
                      ? "Loading..."
                      : isExpanded
                      ? "🌤️ Hide Weather & Safety"
                      : "🌤️ Check Weather & Safety"}
                  </button>

                  {/* Weather Details Section - Shows when expanded */}
                  {isExpanded && weatherData && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* Current Weather Section */}
                        <div>
                          <h4 className="text-lg font-bold text-gray-800 mb-4">
                            Current Weather
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-600">Temperature</p>
                              <p className="text-2xl font-bold text-blue-600">
                                {weatherData.weather?.temperature || "N/A"}°C
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Humidity</p>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                <div
                                  className="h-2 rounded-full bg-blue-500"
                                  style={{
                                    width: `${Math.min(
                                      weatherData.weather?.humidity || 0,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-sm font-semibold text-gray-700">
                                {weatherData.weather?.humidity || 0}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Conditions</p>
                              <p className="font-semibold text-gray-800 capitalize">
                                {weatherData.weather?.description || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Contamination Risk Section */}
                        <div>
                          <h4 className="text-lg font-bold text-gray-800 mb-4">
                            Contamination Risk
                          </h4>
                          <div
                            className={`text-center py-4 rounded-lg mb-4 ${
                              weatherData.contamination?.riskLevel === "High"
                                ? "bg-red-100 text-red-700"
                                : weatherData.contamination?.riskLevel === "Medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            <p className="text-lg font-bold">
                              {weatherData.contamination?.riskLevel || "Unknown"}
                            </p>
                          </div>
                          {weatherData.contamination?.riskMessage && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <p className="text-xs text-blue-800">
                                <span className="font-semibold">💡 Note:</span>{" "}
                                {weatherData.contamination?.riskMessage}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map View */}
      {viewMode === "map" && (
        <ReportsMap
          title="Safe Zones Near You"
          reports={filteredZones.map((zone) => ({
            _id: zone._id,
            title: zone.name,
            address: zone.address || "No address available",
            description: zone.description || "",
            location: zone.location,
            status: zone.type,
            type: zone.type,
            distance: zone.distance,
          }))}
          loading={loadingNearby && userLocation}
          error={locError}
          legendItems={[
            { label: "Tanker", color: "#3b82f6" },
            { label: "Well", color: "#8b5cf6" },
            { label: "Filter", color: "#06b6d4" },
            { label: "Tap", color: "#10b981" },
            { label: "Borehole", color: "#f59e0b" },
            { label: "Other", color: "#6b7280" },
          ]}
          colorForStatus={(status) => {
            const typeColors = {
              Tanker: "#3b82f6",
              Well: "#8b5cf6",
              Filter: "#06b6d4",
              Tap: "#10b981",
              Borehole: "#f59e0b",
              Other: "#6b7280",
            };
            return typeColors[status] || "#3b82f6";
          }}
          popupRenderer={(zone) => (
            <div className="space-y-1 text-xs text-slate-800" style={{ minWidth: "280px" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Safe Zone
              </p>
              <p className="text-sm font-semibold text-slate-900">{zone.title}</p>

              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-[11px] text-slate-500">{zone.address}</p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] font-semibold">Type:</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: "#3b82f6" }}
                  >
                    {zone.type}
                  </span>
                </div>

                {zone.distance && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[11px] font-semibold">Distance:</span>
                    <span className="text-[11px] font-medium text-blue-600">
                      {zone.distance.toFixed(1)} km
                    </span>
                  </div>
                )}
              </div>

              {zone.description && (
                <p className="mt-2 pt-2 border-t border-slate-200 max-w-xs text-[11px] text-slate-600 line-clamp-2">
                  {zone.description}
                </p>
              )}
            </div>
          )}
          heightClass="h-[500px]"
        />
      )}

    </div>
  );
};

export default CitizenSafeZoneView;
