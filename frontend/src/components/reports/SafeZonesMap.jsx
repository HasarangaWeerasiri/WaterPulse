import React from "react";
import { ReportsMap } from "./ReportsMap";
import { useSafeZonesForMap } from "./useSafeZonesForMap";

const TYPE_COLORS = {
  Tanker: "#3b82f6", // Blue
  Well: "#8b5cf6", // Purple
  Filter: "#06b6d4", // Cyan
  Tap: "#10b981", // Green
  Borehole: "#f59e0b", // Amber
  Other: "#6b7280", // Gray
};

export function SafeZonesMap() {
  const { safeZones, loading, error } = useSafeZonesForMap();

  const colorForType = (type) => TYPE_COLORS[type] || "#3b82f6";

  const legendItems = [
    { label: "Tanker", color: TYPE_COLORS["Tanker"] },
    { label: "Well", color: TYPE_COLORS["Well"] },
    { label: "Filter", color: TYPE_COLORS["Filter"] },
    { label: "Tap", color: TYPE_COLORS["Tap"] },
  ];

  // Convert safe zones to reports-like format for ReportsMap
  const zonesForMap = safeZones.map((zone) => ({
    _id: zone._id,
    title: zone.name,
    address: zone.address || "No address available",
    description: zone.description || "",
    location: zone.location,
    status: zone.isAvailable ? "Available" : "Unavailable",
    type: zone.type,
    createdBy: zone.createdBy,
  }));

  return (
    <ReportsMap
      title="Safe Water Zones Map"
      reports={zonesForMap}
      loading={loading}
      error={error}
      legendItems={legendItems}
      colorForStatus={(type) => colorForType(type)}
      popupRenderer={(zone) => (
        <div
          className="space-y-1 text-xs text-slate-800"
          style={{ minWidth: "280px" }}
        >
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
                style={{ backgroundColor: colorForType(zone.type) }}
              >
                {zone.type}
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[11px] font-semibold">Status:</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor:
                    (zone.status === "Available" ? "#10b981" : "#ef4444") +
                    "33",
                  color: zone.status === "Available" ? "#059669" : "#dc2626",
                }}
              >
                {zone.status}
              </span>
            </div>
          </div>

          {zone.description && (
            <p className="mt-2 pt-2 border-t border-slate-200 max-w-xs text-[11px] text-slate-600 line-clamp-2">
              {zone.description}
            </p>
          )}

          {zone.createdBy && (
            <p className="mt-1 text-[11px] text-slate-600">
              <span className="font-semibold">Added by:</span>{" "}
              {zone.createdBy.firstName || zone.createdBy.email}
            </p>
          )}
        </div>
      )}
    />
  );
}

export default SafeZonesMap;
