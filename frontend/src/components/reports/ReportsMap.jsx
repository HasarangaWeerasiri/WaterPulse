import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo fallback

// SRP: Pure visual map for a set of reports.
// DIP: All domain-specific decisions (colors, popup content) are injected via props.
export function ReportsMap({
  title,
  reports,
  loading,
  error,
  legendItems = [],
  colorForStatus,
  popupRenderer,
  heightClass = "h-[460px]",
}) {
  const mapCenter = useMemo(() => {
    if (!reports?.length) return DEFAULT_CENTER;
    const withLocation = reports.filter(
      (r) =>
        r.location &&
        Array.isArray(r.location.coordinates) &&
        r.location.coordinates.length === 2,
    );
    if (!withLocation.length) return DEFAULT_CENTER;
    const [lng, lat] = withLocation[0].location.coordinates;
    return { lat, lng };
  }, [reports]);

  const createIcon = (status) => {
    const base = colorForStatus ? colorForStatus(status) : "#3b82f6";

    return L.divIcon({
      className: "",
      html: `
        <div style="
          position: relative;
          width: 22px;
          height: 22px;
          transform: translate(-50%, -100%);
        ">
          <div style="
            width: 18px;
            height: 18px;
            border-radius: 999px;
            background: ${base};
            box-shadow: 0 0 0 2px rgba(255,255,255,0.9), 0 4px 10px rgba(15,23,42,0.35);
            border: 1px solid rgba(15,23,42,0.2);
          "></div>
          <div style="
            position: absolute;
            left: 50%;
            top: 16px;
            width: 2px;
            height: 6px;
            background: ${base};
            transform: translateX(-50%);
            border-radius: 999px;
          "></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 22],
      popupAnchor: [0, -16],
    });
  };

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#164871]">{title}</h3>
          {legendItems.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-slate-600">
              {legendItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span
                    className="inline-block rounded-full"
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: item.color,
                      boxShadow: "0 0 0 2px rgba(148, 163, 184, 0.35)",
                    }}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        className={`relative w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm ${heightClass}`}
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm font-medium bg-white/70 text-slate-700">
            Loading reports on map...
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center text-sm font-medium text-red-700 bg-red-50">
            {error}
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={11}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {reports
            ?.filter(
              (r) =>
                r.location &&
                Array.isArray(r.location.coordinates) &&
                r.location.coordinates.length === 2,
            )
            .map((report) => {
              const [lng, lat] = report.location.coordinates;
              const status =
                report.markerStatus || report.status || "Unverified";
              const icon = createIcon(status);

              return (
                <Marker key={report._id} position={{ lat, lng }} icon={icon}>
                  <Popup>{popupRenderer ? popupRenderer(report) : null}</Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>
    </div>
  );
}

export default ReportsMap;
