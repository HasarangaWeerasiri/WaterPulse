import React, { useEffect, useState, useMemo } from "react";
import safeZoneApi from "../../services/safeZoneApi";
import { useAuth } from "../../context/AuthContext";

const SafeZoneList = () => {
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Weather states
  const [weatherZoneId, setWeatherZoneId] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

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
      const data = await safeZoneApi.getAllSafeZones();
      setSafeZones(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load safe zones");
      setSafeZones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSafeZones();
  }, []);

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

    setDeleteError("");
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
    setWeatherZoneId(zoneId);
    setWeatherLoading(true);
    setWeatherData(null);
    try {
      const data = await safeZoneApi.getSafeZoneWeather(zoneId);
      setWeatherData(data);
    } catch (err) {
      console.error("Weather fetch failed:", err);
    } finally {
      setWeatherLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {showCreateForm && (
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

      {/* Filters and Create Button */}
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

      {/* Weather Modal */}
      {weatherData && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-amber-50 border-2 border-blue-300 rounded-xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-[#00569c]">
                {weatherData.safeZone.name} - Weather & Risk Assessment
              </h4>
              <p className="text-sm text-gray-600">
                Type: {weatherData.safeZone.type}
              </p>
            </div>
            <button
              onClick={() => {
                setWeatherZoneId(null);
                setWeatherData(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weather Info */}
            <div>
              <h5 className="font-semibold text-gray-800 mb-3">
                Current Weather
              </h5>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Condition:</span>{" "}
                  {weatherData.weather.condition} (
                  {weatherData.weather.description})
                </p>
                <p>
                  <span className="font-semibold">Temperature:</span>{" "}
                  {weatherData.weather.temperature}°C
                </p>
                <p>
                  <span className="font-semibold">Humidity:</span>{" "}
                  {weatherData.weather.humidity}%
                </p>
                <p>
                  <span className="font-semibold">Wind Speed:</span>{" "}
                  {weatherData.weather.windSpeed} m/s
                </p>
              </div>
            </div>

            {/* Contamination Risk */}
            <div>
              <h5 className="font-semibold text-gray-800 mb-3">
                Contamination Risk
              </h5>
              <div
                className={`p-4 rounded-lg ${
                  weatherData.contamination.riskLevel === "High"
                    ? "bg-red-100 border border-red-300"
                    : weatherData.contamination.riskLevel === "Medium"
                      ? "bg-amber-100 border border-amber-300"
                      : "bg-green-100 border border-green-300"
                }`}
              >
                <p
                  className={`font-bold text-lg mb-2 ${
                    weatherData.contamination.riskLevel === "High"
                      ? "text-red-700"
                      : weatherData.contamination.riskLevel === "Medium"
                        ? "text-amber-700"
                        : "text-green-700"
                  }`}
                >
                  Risk Level: {weatherData.contamination.riskLevel}
                </p>
                <p className="text-sm text-gray-700">
                  {weatherData.contamination.riskMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safe Zones List */}
      <div className="p-6 bg-white shadow rounded-xl">
        {loading ? (
          <p className="text-gray-600">Loading safe zones...</p>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        ) : filteredSafeZones.length === 0 ? (
          <p className="text-gray-600">
            No safe zones found. Create one to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredSafeZones.map((zone) => (
              <div
                key={zone._id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">
                      {zone.name}
                    </h4>
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
                  <p className="text-sm text-gray-600 mb-3">
                    {zone.description}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Address</p>
                    <p className="font-semibold text-gray-900">
                      {zone.address || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Coordinates</p>
                    <p className="font-semibold text-gray-900">
                      {zone.location.coordinates[1].toFixed(4)},{" "}
                      {zone.location.coordinates[0].toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Created by:{" "}
                  <span className="font-semibold text-gray-700">
                    {zone.createdBy?.firstName} {zone.createdBy?.lastName}
                  </span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleCheckWeather(zone._id)}
                    disabled={weatherLoading && weatherZoneId === zone._id}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-60 text-sm"
                  >
                    {weatherLoading && weatherZoneId === zone._id
                      ? "Loading..."
                      : "🌤️ Check Weather"}
                  </button>
                  <button
                    onClick={() => handleEditClick(zone)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(zone._id)}
                    disabled={deletingZoneId === zone._id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60 text-sm"
                  >
                    {deletingZoneId === zone._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          outline: none;
          transition: 0.3s;
        }
        .input:focus {
          border-color: #00569c;
          box-shadow: 0 0 0 2px rgba(0, 86, 156, 0.2);
        }
      `}</style>
    </div>
  );
};

export default SafeZoneList;
