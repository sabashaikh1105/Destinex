import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";

function RecenterMap({ center }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [map, center?.[0], center?.[1]]);

  return null;
}

export default function TripMap({ location }) {
  const [coords, setCoords] = useState([20.5937, 78.9629]); // India default

  const label = useMemo(() => {
    if (typeof location === "string") return location;
    return location?.label || location?.value || "";
  }, [location]);

  useEffect(() => {
    let cancelled = false;

    const directLat =
      typeof location === "object" && location ? Number.parseFloat(location.lat) : null;
    const directLon =
      typeof location === "object" && location ? Number.parseFloat(location.lon) : null;

    if (Number.isFinite(directLat) && Number.isFinite(directLon)) {
      setCoords([directLat, directLon]);
      return () => {
        cancelled = true;
      };
    }

    const query = label.trim();
    if (!query) return () => {
      cancelled = true;
    };

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        query
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.length > 0) {
          const lat = Number.parseFloat(data[0].lat);
          const lon = Number.parseFloat(data[0].lon);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            setCoords([lat, lon]);
          }
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [location, label]);

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden">
      <MapContainer center={coords} zoom={10} style={{ height: "100%", width: "100%" }}>
        <RecenterMap center={coords} />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={coords}>
          <Popup>
            {label}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
