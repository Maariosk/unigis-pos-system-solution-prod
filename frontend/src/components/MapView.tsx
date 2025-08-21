import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/globals.css';

import type { Point } from '../api/points';

type Props = { points: Point[] };

/* =============== Helpers =============== */
const zoneOf = (p: any): string => p?.zoneName ?? p?.zone?.name ?? p?.zone ?? '';
const latOf  = (p: any): number | null =>
  typeof p?.latitude === 'number' ? p.latitude : (typeof p?.lat === 'number' ? p.lat : null);
const lngOf  = (p: any): number | null =>
  typeof p?.longitude === 'number' ? p.longitude : (typeof p?.lng === 'number' ? p.lng : null);

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
    .format(Number.isFinite(n) ? n : 0);

/* =============== Fix de tamaño inicial y en resize =============== */
function InvalidateOnLoad() {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 0);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
}

/* =============== Fit bounds seguro =============== */
function FitToPoints({ points }: { points: Point[] }) {
  const map = useMap();

  useEffect(() => {
    const valid = points
      .map(p => ({ lat: latOf(p), lng: lngOf(p) }))
      .filter((c): c is { lat: number; lng: number } => c.lat != null && c.lng != null);

    if (!valid.length) return;

    map.invalidateSize(); // asegura tamaño correcto antes de encuadrar

    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 15, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(valid.map(c => [c.lat, c.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [24, 24], animate: true });
  }, [points, map]);

  return null;
}

/* =============== Iconos =============== */
const colorFromId = (id: number | string) => {
  const n = typeof id === 'number'
    ? id
    : Array.from(String(id)).reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = (n * 137.508) % 360; 
  return `hsl(${hue}, 75%, 50%)`;
};

const makeIcon = (color: string) =>
  L.divIcon({
    className: 'pulse-marker',
    html: `<span class="pulse-dot" style="--dot:${color}"></span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

/* =============== Popup Card =============== */
function PopupCard({ p }: { p: any }) {
  const zone = zoneOf(p);
  const lat  = latOf(p);
  const lng  = lngOf(p);
  const sale = Number(p?.sale ?? 0);

  return (
    <div className="pv-card animate__animated animate__fadeInUp animate__faster">
      <div className="d-flex align-items-start justify-content-between">
        <span className="badge text-bg-light pv-id">
          ID <strong className="ms-1">{p?.id ?? 's/n'}</strong>
        </span>
        <span className="badge pv-sale">{fmtMoney(sale)}</span>
      </div>

      <div className="pv-title">{p?.description ?? 'Sin descripción'}</div>

      <div className="pv-meta">
        <div className="pv-row">
          <span className="pv-label d-inline-flex align-items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/>
            </svg>
            Zona
          </span>
          <span className="pv-value">{zone || '—'}</span>
        </div>

        <div className="pv-row">
          <span className="pv-label d-inline-flex align-items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 2a1 1 0 0 1 1 1v1.07A8.004 8.004 0 0 1 19.93 11H21a1 1 0 1 1 0 2h-1.07A8.004 8.004 0 0 1 13 19.93V21a1 1 0 1 1-2 0v-1.07A8.004 8.004 0 0 1 4.07 13H3a1 1 0 1 1 0-2h1.07A8.004 8.004 0 0 1 11 4.07V3a1 1 0 0 1 1-1Zm0 5a5 5 0 1 0 0 10a5 5 0 0 0 0-10Z"/>
            </svg>
            Coordenadas
          </span>
          <span className="pv-value pv-mono">
            {lat != null && lng != null ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* =============== Componente principal =============== */
export default function MapView({ points }: Props) {
  const fallbackCenter: LatLngExpression = [19.432608, -99.133209]; // CDMX
  const fallbackIcon = useMemo(() => makeIcon('#4f46e5'), []);

  // Icons por punto
  const icons = useMemo(() => {
    const dict = new Map<string, L.DivIcon>();
    points.forEach(p => {
      const idKey = String(p?.id ?? `${latOf(p)}_${lngOf(p)}`);
      dict.set(idKey, makeIcon(colorFromId(idKey)));
    });
    return dict;
  }, [points]);

  return (
    <div className="card animate__animated animate__fadeInUp" style={{ overflow: 'hidden' }}>
      <h3 className="section-title">Mapa de Puntos</h3>
      <div className="fill">
        <MapContainer center={fallbackCenter} zoom={12} className="leaflet-wrapper">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <InvalidateOnLoad />
          <FitToPoints points={points} />

          {points.map((p: any) => {
            const lat = latOf(p);
            const lng = lngOf(p);
            if (lat == null || lng == null) return null;

            const idKey = String(p?.id ?? `${lat}_${lng}`);
            return (
              <Marker
                key={idKey}
                position={[lat, lng] as LatLngExpression}
                icon={icons.get(idKey) ?? fallbackIcon}
                riseOnHover
              >
                <Popup
                  className="pv-popup"
                  autoPan
                  keepInView
                  autoPanPadding={[24, 24]}
                  offset={[0, -6]}
                  closeButton
                >
                  <PopupCard p={p} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
