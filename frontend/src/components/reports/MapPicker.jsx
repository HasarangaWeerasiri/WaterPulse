import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Explicit default marker icon so it works correctly with Vite bundling
const defaultMarkerIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });
  return null;
}

/**
 * MapPicker
 * Props:
 * - value: { latitude, longitude } | null
 * - onChange: ({ latitude, longitude, address }) => void
 */
export function MapPicker({ value, onChange }) {
  const [position, setPosition] = useState(
    value?.latitude && value?.longitude
      ? { lat: value.latitude, lng: value.longitude }
      : { lat: 6.9271, lng: 79.8612 } // Default to Colombo
  );
  const [address, setAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    if (value?.latitude && value?.longitude) {
      setPosition({ lat: value.latitude, lng: value.longitude });
    }
  }, [value?.latitude, value?.longitude]);

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      setLoadingAddress(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      const displayName = data?.display_name || '';
      setAddress(displayName);
      if (onChange) {
        onChange({ latitude: lat, longitude: lng, address: displayName });
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      setAddress('');
      if (onChange) {
        onChange({ latitude: lat, longitude: lng, address: '' });
      }
    } finally {
      setLoadingAddress(false);
    }
  }, [onChange]);

  const handleClick = (latlng) => {
    setPosition(latlng);
    reverseGeocode(latlng.lat, latlng.lng);
  };

  return (
    <div className="space-y-3">
      <div className="h-64 rounded-lg overflow-hidden border border-[#608A9A]/30 shadow-sm">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onClick={handleClick} />
          {position && <Marker position={position} icon={defaultMarkerIcon} />}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-600 font-helvetica">
        Tap on the map to select the exact location of the water issue.
      </p>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Selected Coordinates</label>
        <input
          type="text"
          readOnly
          value={position ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs text-gray-700"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Detected Address</label>
        <textarea
          rows={2}
          readOnly
          value={loadingAddress ? 'Detecting address…' : address}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs text-gray-700 resize-none"
        />
      </div>
    </div>
  );
}

export default MapPicker;
