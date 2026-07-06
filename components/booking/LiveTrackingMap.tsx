'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getTrackingSocket } from '@/lib/socket';

// Default Leaflet marker assets don't resolve correctly under Next.js bundling,
// so we point them at the CDN copies instead of relying on webpack asset paths.
const workerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Blue-tinted marker set (vs. default red) to visually distinguish the destination pin.
const homeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  bookingId: string;
  workerName?: string;
  initialWorkerLat?: number;
  initialWorkerLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

export default function LiveTrackingMap({
  bookingId,
  workerName,
  initialWorkerLat,
  initialWorkerLng,
  destinationLat,
  destinationLng,
}: Props) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(
    initialWorkerLat && initialWorkerLng ? { lat: initialWorkerLat, lng: initialWorkerLng } : null
  );

  useEffect(() => {
    const socket = getTrackingSocket();
    socket.emit('track:booking', { bookingId });

    const onUpdate = (data: { latitude: number; longitude: number }) => {
      setPos({ lat: data.latitude, lng: data.longitude });
    };
    socket.on('location:update', onUpdate);

    return () => {
      socket.emit('track:stop', { bookingId });
      socket.off('location:update', onUpdate);
    };
  }, [bookingId]);

  const center = pos || (destinationLat && destinationLng ? { lat: destinationLat, lng: destinationLng } : { lat: 20.2961, lng: 85.8245 });

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 h-64">
      <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pos && (
          <Marker position={[pos.lat, pos.lng]} icon={workerIcon}>
            <Popup>{workerName || 'Professional'} is here</Popup>
          </Marker>
        )}
        {destinationLat && destinationLng && (
          <Marker position={[destinationLat, destinationLng]} icon={homeIcon}>
            <Popup>Your address</Popup>
          </Marker>
        )}
      </MapContainer>
      {!pos && (
        <p className="text-center text-xs text-slate-400 py-1">Waiting for professional's live location…</p>
      )}
    </div>
  );
}
