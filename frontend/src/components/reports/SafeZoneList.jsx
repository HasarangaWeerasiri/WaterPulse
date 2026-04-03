import React, { useEffect, useState, useMemo } from "react";
import safeZoneApi from "../../services/safeZoneApi";
import SafeZonesMap from "./SafeZonesMap";

const SafeZoneList = ({ mode = "admin" }) => {
  // Main zones list (admin: all zones, authority: my zones)
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // For authority mode: all zones (read-only)
  const [allSafeZones, setAllSafeZones] = useState([]);
  const [allZonesLoading, setAllZonesLoading] = useState(false);
  const [allZonesError, setAllZonesError] = useState("");

  // Active tab for authority mode
  const [activeTab, setActiveTab] = useState("my-zones"); // my-zones | all-zones

  // View mode for list/map toggle
  const [viewMode, setViewMode] = useState("list"); // list | map

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "Well",
    description: "",
    latitude: "",
    longitude: "",
    isAvailable: true,
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete states
  const [deletingZoneId, setDeletingZoneId] = useState("");

  // Weather states - for inline expansion
  const [expandedZoneId, setExpandedZoneId] = useState(null);
  const [zoneWeatherData, setZoneWeatherData] = useState({});
  const [loadingWeatherId, setLoadingWeatherId] = useState(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const safeZoneTypes = [
    "Tanker",
    "Well",
    "Filter",
    "Tap",
    "Borehole",
    "Other",
  ];

  const refreshSafeZones = async () => {
    setLoading(true);
    setError("");
    try {
      // Use getMyCreatedSafeZones for authority mode, getAllSafeZones for admin
      const endpoint =
        mode === "authority"
          ? safeZoneApi.getMyCreatedSafeZones()
          : safeZoneApi.getAllSafeZones();
      const data = await endpoint;
      setSafeZones(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load safe zones");
      setSafeZones([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshAllSafeZones = async () => {
    if (mode !== "authority") return; // Only fetch for authority mode
    setAllZonesLoading(true);
    setAllZonesError("");
    try {
      const data = await safeZoneApi.getAllSafeZones();
      setAllSafeZones(Array.isArray(data) ? data : []);
    } catch (err) {
      setAllZonesError(
        err?.response?.data?.message || "Failed to load all safe zones"
      );
      setAllSafeZones([]);
    } finally {
      setAllZonesLoading(false);
    }
  };

  useEffect(() => {
    refreshSafeZones();
    if (mode === "authority") {
      refreshAllSafeZones();
    }
  }, [mode]);

  const filteredSafeZones = useMemo(() => {
    return safeZones.filter((zone) => {
      if (typeFilter !== "all" && zone.type !== typeFilter) return false;
      if (
        availabilityFilter !== "all" &&
        zone.isAvailable !== (availabilityFilter === "available")
      )
        return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (zone.name || "").toLowerCase();
        const address = (zone.address || "").toLowerCase();
        const creator =
          `${zone.createdBy?.firstName || ""} ${zone.createdBy?.lastName || ""}`.toLowerCase();

        if (![name, address, creator].some((v) => v.includes(query)))
          return false;
      }

      return true;
    });
  }, [safeZones, searchQuery, typeFilter, availabilityFilter]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formData.name.trim()) return setFormError("Zone name is required");
    if (!formData.latitude || !formData.longitude)
      return setFormError("Please provide location coordinates");

    setSubmitting(true);
    try {
      if (editingZoneId) {
        await safeZoneApi.updateSafeZone(editingZoneId, {
          name: formData.name,
          type: formData.type,
          description: formData.description,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          isAvailable: formData.isAvailable,
        });
        setFormSuccess("Safe zone updated successfully!");
        setEditingZoneId(null);
      } else {
        await safeZoneApi.createSafeZone({
          name: formData.name,
          type: formData.type,
          description: formData.description,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        });
        setFormSuccess("Safe zone created successfully!");
      }

      setFormData({
        name: "",
        type: "Well",
        description: "",
        latitude: "",
        longitude: "",
        isAvailable: true,
      });
      setShowCreateForm(false);
      await refreshSafeZones();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save safe zone");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (zoneId) => {
    if (!window.confirm("Delete this safe zone? This cannot be undone."))
      return;

    setDeletingZoneId(zoneId);
    try {
      await safeZoneApi.deleteSafeZone(zoneId);
      await refreshSafeZones();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingZoneId("");
    }
  };

  const handleEditClick = (zone) => {
    setEditingZoneId(zone._id);
    setFormData({
      name: zone.name,
      type: zone.type,
      description: zone.description || "",
      latitude: zone.location.coordinates[1],
      longitude: zone.location.coordinates[0],
      isAvailable: zone.isAvailable,
    });
    setShowCreateForm(true);
  };

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
      const data = await safeZoneApi.getSafeZoneWeather(zoneId);
      setZoneWeatherData((prev) => ({
        ...prev,
        [zoneId]: data,
      }));
      setExpandedZoneId(zoneId);
    } catch (err) {
      console.error("Weather fetch failed:", err);
    } finally {
      setLoadingWeatherId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Authority Mode: Tabs */}
      {mode === "authority" && (
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("my-zones")}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === "my-zones"
                ? "border-b-2 border-[#00569c] text-[#00569c]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Safe Zones
          </button>
          <button
            onClick={() => setActiveTab("all-zones")}
            className={`px-4 py-3 font-semibold transition ${
              activeTab === "all-zones"
                ? "border-b-2 border-[#00569c] text-[#00569c]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Safe Zones
          </button>
        </div>
      )}

      {/* View Mode Toggle - For All Zones tab (Authority only) */}
      {mode === "authority" && activeTab === "all-zones" && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              viewMode === "list"
                ? "bg-[#00569c] text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            📋 List View
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              viewMode === "map"
                ? "bg-[#00569c] text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            🗺️ Map View
          </button>
        </div>
      )}

      {/* Create/Edit Form - Only shown in My Zones tab or admin view */}
      {(mode === "admin" || activeTab === "my-zones") && showCreateForm && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
          <h4 className="text-lg font-bold text-[#00569c] mb-4">
            {editingZoneId ? "Edit Safe Zone" : "Create New Safe Zone"}
          </h4>

          {formError && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-700">{formError}</p>
            </div>
          )}
          {formSuccess && (
            <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-green-700">{formSuccess}</p>
            </div>
          )}

          <form onSubmit={handleCreateOrUpdate} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Zone Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g., Main Water Tanker, Well #5"
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  className="input"
                  required
                >
                  {safeZoneTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Available
                </label>
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleFormChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    Mark as available
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Add any notes..."
                className="input"
                style={{ height: 80 }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Latitude *
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleFormChange}
                  placeholder="e.g., 6.9271"
                  step="0.0001"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Longitude *
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleFormChange}
                  placeholder="e.g., 80.7789"
                  step="0.0001"
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-[#00569c] text-white rounded-lg hover:bg-[#003f73] transition disabled:opacity-60"
              >
                {submitting
                  ? "Saving..."
                  : editingZoneId
                    ? "Update Zone"
                    : "Create Zone"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingZoneId(null);
                  setFormData({
                    name: "",
                    type: "Well",
                    description: "",
                    latitude: "",
                    longitude: "",
                    isAvailable: true,
                  });
                  setFormError("");
                  setFormSuccess("");
                }}
                className="flex-1 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Create Button - Only shown in My Zones or admin view */}
      {(mode === "admin" || activeTab === "my-zones") && (
        <>
          {/* View Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                viewMode === "list"
                  ? "bg-[#00569c] text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              📋 List View
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                viewMode === "map"
                  ? "bg-[#00569c] text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              🗺️ Map View
            </button>
          </div>

          {/* Filters and Create Button - Only shown in List View */}
          {viewMode === "list" && (
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              <div className="flex-1">
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  Search
                </label>
                <input
                  className="input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zone name, address, creator..."
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Type
            </label>
            <select
              className="input"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {safeZoneTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Availability
            </label>
            <select
              className="input"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setEditingZoneId(null);
            }}
            className="px-6 py-2 bg-[#00569c] text-white rounded-lg hover:bg-[#003f73] transition whitespace-nowrap"
          >
            {showCreateForm ? "Cancel" : "+ New Zone"}
          </button>
            </div>
          )}
        </>
      )}

      {/* Safe Zones List - My Zones (editable) */}
      {(mode === "admin" || activeTab === "my-zones") && viewMode === "list" && (
        <div className="p-6 bg-white shadow rounded-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {mode === "admin" ? "All Safe Zones" : "My Safe Zones"}
          </h3>
          {loading ? (
            <p className="text-gray-600">Loading safe zones...</p>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-700">{error}</p>
            </div>
          ) : filteredSafeZones.length === 0 ? (
            <p className="text-gray-600">
              {mode === "admin"
                ? "No safe zones found."
                : "You haven't created any safe zones yet."}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredSafeZones.map((zone) => (
                <RenderZoneCard
                  key={zone._id}
                  zone={zone}
                  mode={mode}
                  onEdit={() => handleEditClick(zone)}
                  onDelete={() => handleDelete(zone._id)}
                  onCheckWeather={() => handleCheckWeather(zone._id)}
                  isDeleting={deletingZoneId === zone._id}
                  isCheckingWeather={loadingWeatherId === zone._id}
                  isExpanded={expandedZoneId === zone._id}
                  weatherData={zoneWeatherData[zone._id]}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Safe Zones Map - My Zones */}
      {(mode === "admin" || activeTab === "my-zones") && viewMode === "map" && (
        <div className="p-6 bg-white shadow rounded-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {mode === "admin" ? "All Safe Zones Map" : "My Safe Zones Map"}
          </h3>
          <SafeZonesMap />
        </div>
      )}

      {/* Safe Zones List - All Zones (read-only) for Authority */}
      {mode === "authority" && activeTab === "all-zones" && viewMode === "list" && (
        <div className="p-6 bg-white shadow rounded-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            All Safe Zones (Read-Only)
          </h3>
          {allZonesLoading ? (
            <p className="text-gray-600">Loading all safe zones...</p>
          ) : allZonesError ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-700">{allZonesError}</p>
            </div>
          ) : allSafeZones.length === 0 ? (
            <p className="text-gray-600">No safe zones available.</p>
          ) : (
            <div className="space-y-4">
              {allSafeZones.map((zone) => (
                <RenderZoneCard
                  key={zone._id}
                  zone={zone}
                  mode="read-only"
                  onCheckWeather={() => handleCheckWeather(zone._id)}
                  isCheckingWeather={loadingWeatherId === zone._id}
                  isExpanded={expandedZoneId === zone._id}
                  weatherData={zoneWeatherData[zone._id]}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Safe Zones Map - All Zones (read-only) for Authority */}
      {mode === "authority" && activeTab === "all-zones" && viewMode === "map" && (
        <div className="p-6 bg-white shadow rounded-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            All Safe Zones Map (Read-Only)
          </h3>
          <SafeZonesMap />
        </div>
      )}


    </div>
  );
};

// Helper component to render a zone card with conditional actions
const RenderZoneCard = ({
  zone,
  mode,
  onEdit,
  onDelete,
  onCheckWeather,
  isDeleting,
  isCheckingWeather,
  isExpanded,
  weatherData,
}) => {
  const isReadOnly = mode === "read-only";
  const isEditable = mode === "admin" || mode === "authority";

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-gray-900 text-lg">{zone.name}</h4>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {zone.type}
            </span>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                zone.isAvailable
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {zone.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Created</p>
          <p className="text-sm font-semibold text-gray-900">
            {new Date(zone.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {zone.description && (
        <p className="text-sm text-gray-600 mb-3">{zone.description}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <p className="text-gray-600">Address</p>
          <p className="font-semibold text-gray-900">{zone.address || "N/A"}</p>
        </div>
        <div>
          <p className="text-gray-600">Coordinates</p>
          <p className="font-semibold text-gray-900">
            {zone.location.coordinates[1].toFixed(4)},{" "}
            {zone.location.coordinates[0].toFixed(4)}
          </p>
        </div>
      </div>

      {!isReadOnly && (
        <div className="text-xs text-gray-500 mb-4">
          Created by:{" "}
          <span className="font-semibold text-gray-700">
            {zone.createdBy?.firstName} {zone.createdBy?.lastName}
          </span>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onCheckWeather}
          disabled={isCheckingWeather}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-60 text-sm"
        >
          {isCheckingWeather
            ? "Loading..."
            : isExpanded
            ? "🌤️ Hide Weather"
            : "🌤️ Check Weather"}
        </button>
        {isEditable && !isReadOnly && (
          <>
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60 text-sm"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </>
        )}
      </div>

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
                {weatherData.weather?.windSpeed && (
                  <div>
                    <p className="text-sm text-gray-600">Wind Speed</p>
                    <p className="font-semibold text-gray-800">
                      {weatherData.weather.windSpeed} m/s
                    </p>
                  </div>
                )}
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
};

export default SafeZoneList;
