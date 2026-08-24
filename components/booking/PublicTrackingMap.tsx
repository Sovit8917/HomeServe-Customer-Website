'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Default Leaflet marker assets don't resolve correctly under Next.js bundling,
// so we point them at the CDN copies instead of relying on webpack asset paths.
const workerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  latitude: number;
  longitude: number;
  workerName?: string;
}

// Deliberately simple/static (no socket subscription): the public share link
// has no JWT to open a tracking socket with, so the parent page polls the
// public REST endpoint instead and just re-renders this with fresh coords.
export default function PublicTrackingMap({ latitude, longitude, workerName }: Props) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 h-72">
      <MapContainer center={[latitude, longitude]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={workerIcon}>
          <Popup>{workerName || 'Professional'} is here</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
