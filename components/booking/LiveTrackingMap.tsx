'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Radio, WifiOff } from 'lucide-react';
import { getTrackingSocket } from '@/lib/socket';
import { trackingApi } from '@/lib/api';
import { haversineDistanceKm, estimateEtaMinutes, formatDistance, formatEta, ARRIVED_RADIUS_KM } from '@/lib/geo';

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
  // When the job is already IN_PROGRESS the worker is on-site, not
  // "approaching" — the status line reads differently and ETA doesn't apply.
  jobStarted?: boolean;
}

// How long without a fresh socket ping before we call the feed "stale"
// and fall back to REST polling rather than assuming the worker is still
// moving toward the last known point.
const STALE_AFTER_MS = 45_000;
// How often to poll GET /tracking/booking/:id (+ /eta) while the socket
// is stale/disconnected, or once up front for the very first render.
const REST_POLL_MS = 20_000;

export default function LiveTrackingMap({
  bookingId,
  workerName,
  initialWorkerLat,
  initialWorkerLng,
  destinationLat,
  destinationLng,
  jobStarted,
}: Props) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(
    initialWorkerLat && initialWorkerLng ? { lat: initialWorkerLat, lng: initialWorkerLng } : null
  );
  const [lastUpdateAt, setLastUpdateAt] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [connected, setConnected] = useState(true);
  // Server-computed ETA (haversine x1.4 road multiplier, explicitly
  // `approximate: true`) — preferred over the client-side estimate
  // whenever the REST fallback has fetched one; keeps the two ETAs from
  // disagreeing since they're not quite the same formula.
  const [serverEta, setServerEta] = useState<{ etaMinutes: number; distanceKm: number } | null>(null);
  const staleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // REST fallback: last-known location + approximate ETA, used for the
  // very first render (before any socket push has arrived) and again on
  // a loop whenever the socket is stale or disconnected.
  const pollRest = useCallback(async () => {
    try {
      const [locRes, etaRes] = await Promise.all([
        trackingApi.getLastLocation(bookingId),
        trackingApi.getEta(bookingId),
      ]);
      const loc = (locRes.data.data || locRes.data)?.location;
      if (loc) {
        setPos((cur) => cur ?? { lat: loc.latitude, lng: loc.longitude });
        setLastUpdateAt((cur) => cur ?? new Date(loc.updatedAt).getTime());
      }
      const eta = etaRes.data.data || etaRes.data;
      if (eta?.available) {
        setServerEta({ etaMinutes: eta.etaMinutes, distanceKm: eta.distanceKm });
      } else {
        setServerEta(null);
      }
    } catch {
      // Best-effort fallback — the socket path (or an empty state) still
      // works fine if this fails, so nothing to surface to the user.
    }
  }, [bookingId]);

  useEffect(() => {
    // Fetch once immediately so there's something on screen even before
    // the socket connects, then keep polling only while we actually need
    // the fallback (stale or disconnected) — see the effect below.
    pollRest();
  }, [pollRest]);

  useEffect(() => {
    const socket = getTrackingSocket();
    socket.emit('track:booking', { bookingId });

    const onUpdate = (data: { latitude: number; longitude: number }) => {
      setPos({ lat: data.latitude, lng: data.longitude });
      setLastUpdateAt(Date.now());
      setIsStale(false);
    };
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('location:update', onUpdate);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setConnected(socket.connected);

    // Re-check staleness every few seconds independent of new pings, so
    // the badge flips to "signal lost" even if no update ever arrives again.
    staleTimerRef.current = setInterval(() => {
      setLastUpdateAt((cur) => {
        if (cur && Date.now() - cur > STALE_AFTER_MS) setIsStale(true);
        return cur;
      });
    }, 5000);

    return () => {
      socket.emit('track:stop', { bookingId });
      socket.off('location:update', onUpdate);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      if (staleTimerRef.current) clearInterval(staleTimerRef.current);
    };
  }, [bookingId]);

  // Fall back to REST polling only while the live feed can't be trusted —
  // stops as soon as a fresh socket push lands (isStale flips back false).
  useEffect(() => {
    const shouldPoll = !connected || isStale;
    if (shouldPoll && !restPollRef.current) {
      restPollRef.current = setInterval(pollRest, REST_POLL_MS);
    } else if (!shouldPoll && restPollRef.current) {
      clearInterval(restPollRef.current);
      restPollRef.current = null;
    }
    return () => {
      if (restPollRef.current) {
        clearInterval(restPollRef.current);
        restPollRef.current = null;
      }
    };
  }, [connected, isStale, pollRest]);

  const center = pos || (destinationLat && destinationLng ? { lat: destinationLat, lng: destinationLng } : { lat: 20.2961, lng: 85.8245 });

  const hasRoute = !!(pos && destinationLat && destinationLng);
  const clientDistanceKm = hasRoute ? haversineDistanceKm(pos!.lat, pos!.lng, destinationLat!, destinationLng!) : null;
  const clientEtaMinutes = clientDistanceKm !== null ? estimateEtaMinutes(clientDistanceKm) : null;

  // Prefer the server's ETA (it's the same one shown elsewhere, e.g. if
  // this ever gets surfaced outside the map) — fall back to the
  // client-side straight-line estimate only when the server has nothing.
  const distanceKm = serverEta?.distanceKm ?? clientDistanceKm;
  const etaMinutes = serverEta?.etaMinutes ?? clientEtaMinutes;
  const hasArrived = distanceKm !== null && distanceKm !== undefined && distanceKm <= ARRIVED_RADIUS_KM;

  let statusText = 'Waiting for location…';
  if (pos) {
    if (jobStarted) statusText = `${workerName || 'Your professional'} is on the job`;
    else if (hasArrived) statusText = `${workerName || 'Your professional'} has arrived`;
    else statusText = `${workerName || 'Your professional'} is on the way`;
  }

  return (
    <div>
      {/* Status / ETA bar */}
      <div className="flex items-center justify-between gap-3 mb-2 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {connected && !isStale ? (
            <Radio className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          )}
          <span className="text-xs font-medium text-slate-700 truncate">{statusText}</span>
        </div>
        {!jobStarted && etaMinutes !== null && etaMinutes !== undefined && !hasArrived && (
          <div className="flex items-center gap-1 flex-shrink-0 text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
            <Navigation className="h-3 w-3" /> {formatEta(etaMinutes)}
          </div>
        )}
      </div>

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
      </div>

      <div className="flex items-center justify-between mt-1.5 px-0.5">
        {!pos ? (
          <p className="text-xs text-slate-400">Waiting for professional's live location…</p>
        ) : (
          <p className="text-xs text-slate-400">
            {distanceKm !== null && distanceKm !== undefined && !jobStarted ? `${formatDistance(distanceKm)} away · ` : ''}
            {isStale ? 'Signal lost — showing last known location' : 'Live'}
          </p>
        )}
      </div>
    </div>
  );
}
