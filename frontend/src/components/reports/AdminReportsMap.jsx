import React, { useEffect, useMemo, useState } from "react";
import { ReportsMap } from "./ReportsMap";
import { useReportsForMap } from "./useReportsForMap";
import safeZoneApi from "../../services/safeZoneApi";

const STATUS_COLORS = {
  Confirmed: "#16a34a", // green
  Unverified: "#eab308", // yellow
  Resolved: "#22c55e",
  Spam: "#9ca3af",
  SafeZoneAvailable: "#0ea5e9",
  SafeZoneUnavailable: "#ef4444",
};

export function AdminReportsMap() {
  // SRP: Delegate data loading to hook, rendering to ReportsMap.
  const { reports, loading, error } = useReportsForMap();
  const [safeZones, setSafeZones] = useState([]);
  const [safeZoneLoading, setSafeZoneLoading] = useState(true);
  const [safeZoneError, setSafeZoneError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchSafeZones() {
      try {
        setSafeZoneLoading(true);
        setSafeZoneError("");
        const data = await safeZoneApi.getAllSafeZones();
        if (!isMounted) return;
        setSafeZones(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        setSafeZoneError(
          err?.response?.data?.message || "Failed to load safe zones for map",
        );
      } finally {
        if (isMounted) setSafeZoneLoading(false);
      }
    }

    fetchSafeZones();
    return () => {
      isMounted = false;
    };
  }, []);

  const combinedMarkers = useMemo(() => {
    const mappedReports = (reports || []).map((report) => ({
      ...report,
      _id: `report-${report._id}`,
      markerKind: "report",
      markerStatus: report.status || "Unverified",
    }));

    const mappedSafeZones = (safeZones || []).map((safeZone) => ({
      ...safeZone,
      _id: `safezone-${safeZone._id}`,
      markerKind: "safezone",
      markerStatus: safeZone.isAvailable
        ? "SafeZoneAvailable"
        : "SafeZoneUnavailable",
    }));

    return [...mappedReports, ...mappedSafeZones];
  }, [reports, safeZones]);

  const colorForStatus = (status) => STATUS_COLORS[status] || "#3b82f6";

  const legendItems = [
    { label: "Confirmed", color: STATUS_COLORS.Confirmed },
    { label: "Unverified", color: STATUS_COLORS.Unverified },
    { label: "Safe Zone (Available)", color: STATUS_COLORS.SafeZoneAvailable },
    {
      label: "Safe Zone (Unavailable)",
      color: STATUS_COLORS.SafeZoneUnavailable,
    },
  ];

  return (
    <ReportsMap
      title="Contamination + Safe Zones Map"
      reports={combinedMarkers}
      loading={loading || safeZoneLoading}
      error={error || safeZoneError}
      legendItems={legendItems}
      colorForStatus={(markerStatus) => colorForStatus(markerStatus)}
      popupRenderer={(item) => {
        if (item.markerKind === "safezone") {
          return (
            <div className="space-y-1 text-xs text-slate-800">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Safe Zone
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {item.name}
              </p>
              <p className="text-[11px] text-slate-500">
                {item.address || "No address available"}
              </p>
              <p className="text-[11px] text-slate-600">
                <span className="font-semibold">Type:</span> {item.type}
              </p>
              <p className="text-[11px]">
                <span className="font-semibold">Status:</span>{" "}
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: item.isAvailable
                      ? "#0ea5e933"
                      : "#ef444433",
                    color: item.isAvailable ? "#0369a1" : "#b91c1c",
                  }}
                >
                  {item.isAvailable ? "Available" : "Unavailable"}
                </span>
              </p>
              {item.description && (
                <p className="mt-1 max-w-xs text-[11px] text-slate-600 line-clamp-3">
                  {item.description}
                </p>
              )}
            </div>
          );
        }

        const status = item.status || "Unverified";
        return (
          <div className="space-y-1 text-xs text-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Report
            </p>
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="text-[11px] text-slate-500">
              {item.address || "No address available"}
            </p>
            <p className="mt-1 text-[11px]">
              <span className="font-semibold">Status:</span>{" "}
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: (STATUS_COLORS[status] || "#e5e7eb") + "33",
                  color: STATUS_COLORS[status] || "#374151",
                }}
              >
                {status}
              </span>
            </p>
            {item.reportedBy && (
              <p className="text-[11px] text-slate-600">
                <span className="font-semibold">Citizen:</span>{" "}
                {item.reportedBy.firstName || item.reportedBy.email}
              </p>
            )}
            <p className="mt-1 max-w-xs text-[11px] text-slate-600 line-clamp-3">
              {item.description}
            </p>
          </div>
        );
      }}
    />
  );
}

export default AdminReportsMap;
