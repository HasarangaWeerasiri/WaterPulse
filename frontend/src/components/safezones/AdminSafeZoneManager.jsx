import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import safeZoneApi from "../../services/safeZoneApi";

const SAFE_ZONE_TYPES = [
  "Tanker",
  "Well",
  "Filter",
  "Tap",
  "Borehole",
  "Other",
];

const emptyForm = {
  name: "",
  type: "Tanker",
  description: "",
  latitude: "",
  longitude: "",
  isAvailable: true,
};

const toFormFromZone = (zone) => ({
  name: zone.name || "",
  type: zone.type || "Tanker",
  description: zone.description || "",
  latitude: String(zone?.location?.coordinates?.[1] ?? ""),
  longitude: String(zone?.location?.coordinates?.[0] ?? ""),
  isAvailable: !!zone.isAvailable,
});

export default function AdminSafeZoneManager() {
  const [safeZones, setSafeZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(emptyForm);

  const [busyMap, setBusyMap] = useState({});
  const [weatherOpenId, setWeatherOpenId] = useState("");
  const [weatherLoadingId, setWeatherLoadingId] = useState("");
  const [weatherByZoneId, setWeatherByZoneId] = useState({});
  const [weatherErrorByZoneId, setWeatherErrorByZoneId] = useState({});

  const setBusy = (id, status) => {
    setBusyMap((prev) => ({ ...prev, [id]: status }));
  };

  const notify = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2500);
  };

  const loadSafeZones = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await safeZoneApi.getAllSafeZones();
      setSafeZones(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load safe zones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSafeZones();
  }, []);

  const stats = useMemo(() => {
    const total = safeZones.length;
    const available = safeZones.filter((zone) => zone.isAvailable).length;
    const unavailable = total - available;
    return { total, available, unavailable };
  }, [safeZones]);

  const visibleSafeZones = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = safeZones.filter((zone) => {
      const lat = zone?.location?.coordinates?.[1];
      const lng = zone?.location?.coordinates?.[0];
      const coordinatesText =
        lat != null && lng != null ? `${lat}, ${lng}` : "";

      const matchesSearch =
        !term ||
        [zone.name, zone.type, zone.description, zone.address, coordinatesText]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));

      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "available" && zone.isAvailable) ||
        (availabilityFilter === "unavailable" && !zone.isAvailable);

      const matchesType = typeFilter === "all" || zone.type === typeFilter;

      return matchesSearch && matchesAvailability && matchesType;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name-asc")
        return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "name-desc")
        return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "type-asc")
        return (a.type || "").localeCompare(b.type || "");
      if (sortBy === "availability")
        return Number(b.isAvailable) - Number(a.isAvailable);

      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();

      if (sortBy === "oldest") return aTime - bTime;
      return bTime - aTime;
    });

    return sorted;
  }, [safeZones, searchTerm, availabilityFilter, typeFilter, sortBy]);

  const handleCreateChange = (event) => {
    const { name, value, type, checked } = event.target;
    setCreateForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await safeZoneApi.createSafeZone({
        ...createForm,
        latitude: Number(createForm.latitude),
        longitude: Number(createForm.longitude),
      });
      setCreateForm(emptyForm);
      setCreating(false);
      notify("Safe zone created successfully.");
      await loadSafeZones();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create safe zone.");
    }
  };

  const startEdit = (zone) => {
    setEditingId(zone._id);
    setEditForm(toFormFromZone(zone));
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditForm(emptyForm);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) return;

    setError("");
    setBusy(editingId, true);

    try {
      const payload = {
        ...editForm,
        latitude: Number(editForm.latitude),
        longitude: Number(editForm.longitude),
      };

      const response = await safeZoneApi.updateSafeZone(editingId, payload);
      const updated = response?.safeZone;

      setSafeZones((prev) =>
        prev.map((zone) => (zone._id === editingId ? updated || zone : zone)),
      );
      notify("Safe zone updated.");
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update safe zone.");
    } finally {
      setBusy(editingId, false);
    }
  };

  const handleDelete = async (zoneId) => {
    if (!window.confirm("Delete this safe zone permanently?")) return;

    setError("");
    setBusy(zoneId, true);

    try {
      await safeZoneApi.deleteSafeZone(zoneId);
      setSafeZones((prev) => prev.filter((zone) => zone._id !== zoneId));
      notify("Safe zone deleted.");
      if (editingId === zoneId) {
        cancelEdit();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete safe zone.");
    } finally {
      setBusy(zoneId, false);
    }
  };

  const handleAvailabilityToggle = async (zone) => {
    setError("");
    setBusy(zone._id, true);

    try {
      const response = await safeZoneApi.updateSafeZone(zone._id, {
        isAvailable: !zone.isAvailable,
      });
      const updated = response?.safeZone;
      setSafeZones((prev) =>
        prev.map((item) => (item._id === zone._id ? updated || item : item)),
      );
      notify(
        `Safe zone marked as ${!zone.isAvailable ? "available" : "unavailable"}.`,
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update availability.");
    } finally {
      setBusy(zone._id, false);
    }
  };

  const handleWeatherPreview = async (zoneId) => {
    if (weatherOpenId === zoneId) {
      setWeatherOpenId("");
      return;
    }

    setWeatherOpenId(zoneId);

    if (weatherByZoneId[zoneId]) {
      return;
    }

    setWeatherLoadingId(zoneId);
    setWeatherErrorByZoneId((prev) => ({ ...prev, [zoneId]: "" }));

    try {
      const data = await safeZoneApi.getSafeZoneWeather(zoneId);
      setWeatherByZoneId((prev) => ({ ...prev, [zoneId]: data }));
    } catch (err) {
      setWeatherErrorByZoneId((prev) => ({
        ...prev,
        [zoneId]:
          err.response?.data?.message || "Failed to load weather preview.",
      }));
    } finally {
      setWeatherLoadingId("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-52 gap-2 text-sm text-gray-500">
        <RefreshCw size={16} className="animate-spin" />
        Loading safe zones...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="p-6 text-white shadow-lg rounded-2xl bg-linear-to-r from-[#164871] to-[#608A9A]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Safe Zone Management</h2>
            <p className="mt-1 text-sm text-white/80">
              Create, edit, and maintain trusted clean water points.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSafeZones}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white transition border rounded-lg bg-white/10 border-white/30 hover:bg-white/20"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              onClick={() => setCreating((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#164871] transition bg-white rounded-lg hover:bg-gray-100"
            >
              {creating ? <X size={14} /> : <Plus size={14} />}
              {creating ? "Close" : "Add Safe Zone"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
          <p className="text-xs text-gray-500 uppercase">Total</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="p-4 bg-white border border-emerald-100 shadow-sm rounded-xl">
          <p className="text-xs text-emerald-700 uppercase">Available</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {stats.available}
          </p>
        </div>
        <div className="p-4 bg-white border border-red-100 shadow-sm rounded-xl">
          <p className="text-xs text-red-700 uppercase">Unavailable</p>
          <p className="mt-1 text-2xl font-bold text-red-700">
            {stats.unavailable}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-red-700 border border-red-200 rounded-xl bg-red-50">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {notice && (
        <div className="flex items-center gap-2 px-4 py-3 text-sm border rounded-xl text-emerald-700 bg-emerald-50 border-emerald-200">
          <CheckCircle2 size={16} className="shrink-0" />
          {notice}
        </div>
      )}

      {creating && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-5 space-y-4 bg-white border border-gray-200 shadow-sm rounded-xl"
        >
          <h3 className="text-lg font-semibold text-gray-800">
            Create New Safe Zone
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="input"
              name="name"
              value={createForm.name}
              onChange={handleCreateChange}
              placeholder="Safe zone name"
              required
            />
            <select
              className="input"
              name="type"
              value={createForm.type}
              onChange={handleCreateChange}
            >
              {SAFE_ZONE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              step="any"
              name="latitude"
              value={createForm.latitude}
              onChange={handleCreateChange}
              placeholder="Latitude"
              required
            />
            <input
              className="input"
              type="number"
              step="any"
              name="longitude"
              value={createForm.longitude}
              onChange={handleCreateChange}
              placeholder="Longitude"
              required
            />
          </div>
          <textarea
            className="input"
            name="description"
            value={createForm.description}
            onChange={handleCreateChange}
            placeholder="Description"
            rows={3}
          />
          <button className="px-4 py-2 text-sm font-semibold text-white transition rounded-lg bg-[#00569c] hover:bg-[#003f73]">
            Save Safe Zone
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 p-4 bg-white border border-gray-200 md:grid-cols-4 rounded-xl">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search name, type, address..."
          className="input"
        />

        <select
          value={availabilityFilter}
          onChange={(event) => setAvailabilityFilter(event.target.value)}
          className="input"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="input"
        >
          <option value="all">All Types</option>
          {SAFE_ZONE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="input"
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="name-asc">Sort: Name A-Z</option>
          <option value="name-desc">Sort: Name Z-A</option>
          <option value="type-asc">Sort: Type A-Z</option>
          <option value="availability">Sort: Availability</option>
        </select>
      </div>

      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs tracking-wide text-white uppercase bg-[#164871]">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Coordinates</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleSafeZones.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-gray-500"
                    colSpan={6}
                  >
                    No safe zones match the current filters.
                  </td>
                </tr>
              )}

              {visibleSafeZones.map((zone) => {
                const lat = zone?.location?.coordinates?.[1];
                const lng = zone?.location?.coordinates?.[0];
                const isBusy = !!busyMap[zone._id];
                const isWeatherOpen = weatherOpenId === zone._id;
                const isWeatherLoading = weatherLoadingId === zone._id;
                const weatherData = weatherByZoneId[zone._id];
                const weatherError = weatherErrorByZoneId[zone._id];
                const weatherRisk =
                  weatherData?.contamination?.riskLevel || "Low";
                const riskColorClass =
                  weatherRisk === "High"
                    ? "text-red-700 bg-red-100"
                    : weatherRisk === "Medium"
                      ? "text-amber-700 bg-amber-100"
                      : "text-emerald-700 bg-emerald-100";

                return (
                  <React.Fragment key={zone._id}>
                    <tr className="align-top">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {zone.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{zone.type}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {lat != null && lng != null ? `${lat}, ${lng}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {zone.address || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            zone.isAvailable
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {zone.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleWeatherPreview(zone._id)}
                            disabled={isWeatherLoading}
                            className="px-2.5 py-1.5 text-xs font-semibold text-cyan-800 bg-cyan-50 rounded-md hover:bg-cyan-100 disabled:opacity-50"
                          >
                            {isWeatherLoading
                              ? "Loading..."
                              : isWeatherOpen
                                ? "Hide Weather"
                                : "Weather"}
                          </button>
                          <button
                            onClick={() => handleAvailabilityToggle(zone)}
                            disabled={isBusy}
                            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 disabled:opacity-50"
                          >
                            Toggle
                          </button>
                          <button
                            onClick={() => startEdit(zone)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(zone._id)}
                            disabled={isBusy}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isWeatherOpen && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 bg-slate-50">
                          {isWeatherLoading && (
                            <p className="text-sm text-slate-600">
                              Loading latest weather...
                            </p>
                          )}

                          {!isWeatherLoading && weatherError && (
                            <p className="text-sm text-red-700">
                              {weatherError}
                            </p>
                          )}

                          {!isWeatherLoading &&
                            !weatherError &&
                            weatherData && (
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                  <p className="text-xs tracking-wide text-slate-500 uppercase">
                                    Weather
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-slate-900">
                                    {weatherData.weather?.condition} -{" "}
                                    {weatherData.weather?.description}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-600">
                                    Temp: {weatherData.weather?.temperature} C |
                                    Humidity: {weatherData.weather?.humidity}% |
                                    Wind: {weatherData.weather?.windSpeed} m/s
                                  </p>
                                </div>

                                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                                  <p className="text-xs tracking-wide text-slate-500 uppercase">
                                    Contamination Risk
                                  </p>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${riskColorClass}`}
                                    >
                                      {weatherRisk}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-700">
                                    {weatherData.contamination?.riskMessage}
                                  </p>
                                </div>
                              </div>
                            )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingId && (
        <form
          onSubmit={handleEditSubmit}
          className="p-5 space-y-4 bg-white border border-blue-100 shadow-sm rounded-xl"
        >
          <h3 className="text-lg font-semibold text-gray-800">
            Edit Safe Zone
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="input"
              name="name"
              value={editForm.name}
              onChange={handleEditChange}
              required
            />
            <select
              className="input"
              name="type"
              value={editForm.type}
              onChange={handleEditChange}
            >
              {SAFE_ZONE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              step="any"
              name="latitude"
              value={editForm.latitude}
              onChange={handleEditChange}
              required
            />
            <input
              className="input"
              type="number"
              step="any"
              name="longitude"
              value={editForm.longitude}
              onChange={handleEditChange}
              required
            />
          </div>
          <textarea
            className="input"
            name="description"
            value={editForm.description}
            onChange={handleEditChange}
            rows={3}
          />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isAvailable"
              checked={editForm.isAvailable}
              onChange={handleEditChange}
            />
            Mark as available
          </label>

          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-semibold text-white transition rounded-lg bg-[#00569c] hover:bg-[#003f73]">
              Update Safe Zone
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 text-sm font-semibold text-gray-700 transition bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          outline: none;
          transition: 0.25s;
          font-size: 14px;
        }

        .input:focus {
          border-color: #00569c;
          box-shadow: 0 0 0 2px rgba(0, 86, 156, 0.15);
        }
      `}</style>
    </div>
  );
}
