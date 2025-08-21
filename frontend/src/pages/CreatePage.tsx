import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createPoint, Point } from '../api/points';
import FormPoint from '../components/FormPoint';

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import L from 'leaflet';

// Fix para el icono por defecto (por si en otras vistas lo usas)
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

declare global {
  interface Window {
    bootstrap: any;
    GeoSearch: {
      GeoSearchControl: new (opts: any) => any;
      OpenStreetMapProvider: new (opts?: any) => any;
    };
  }
}

/* ===================== Iconos / UI helpers ===================== */
const IconInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm0 4a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 12 6zm2 12h-4v-1.5h1V11h-1V9.5h3v7.5h1V18z"/>
  </svg>
);
const IconSpinner = () => (
  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
);

/* ========= Aviso flotante (éxito / error) ========= */
type Notice = { type: 'success' | 'error'; message: string };

function FloatingNotice({
  notice,
  onClose,
  ms = 3500,
}: {
  notice: Notice;
  onClose: () => void;
  ms?: number;
}) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setClosing(true);
      setTimeout(onClose, 400);
    }, ms);
    return () => clearTimeout(t);
  }, [ms, onClose]);

  const cls =
    'position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg border rounded-3 px-3 py-2 animate__animated ' +
    (closing ? 'animate__fadeOutUp' : 'animate__fadeInDown') +
    (notice.type === 'success' ? ' bg-success text-white' : ' bg-danger text-white');

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cls}
      style={{ zIndex: 2100, minWidth: 280, maxWidth: '92vw', cursor: 'pointer' }}
      onClick={() => {
        setClosing(true);
        setTimeout(onClose, 300);
      }}
    >
      {notice.message}
    </div>,
    document.body
  );
}

/* ========= Overlay “Guardando…” ========= */
function SavingOverlay({ text = 'Guardando…' }: { text?: string }) {
  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        background: 'rgba(255,255,255,.65)',
        backdropFilter: 'blur(2px)',
        zIndex: 3000,            // sobre todo
        pointerEvents: 'auto',   // bloquea clics
      }}
    >
      <div className="bg-white border rounded-3 px-4 py-3 d-flex align-items-center gap-3 shadow-lg animate__animated animate__fadeIn">
        <IconSpinner />
        <strong className="fs-6">{text}</strong>
      </div>
    </div>,
    document.body
  );
}

/* ========= Leaflet helpers ========= */
function MapRefBridge({ mapRef }: { mapRef: React.MutableRefObject<LeafletMap | null> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map]);
  return null;
}

function ClickToMark({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

/** Control de búsqueda usando el bundle CDN de leaflet-geosearch */
function SearchControl({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const GS = window.GeoSearch;
    if (!GS) return;

    const provider = new GS.OpenStreetMapProvider();

    // Evita fitBounds internos del control (previene "Bounds are not valid")
    const search = new GS.GeoSearchControl({
      provider,
      style: 'bar',
      showMarker: false,
      autoClose: true,
      retainZoomLevel: false,
      searchLabel: 'Buscar lugar…',
      updateMap: false,
    });

    map.addControl(search as any);

    const onShow = (e: any) => {
      const loc = e?.location?.location ?? e?.location ?? {};
      const lat = typeof loc.y === 'number' ? loc.y : loc.lat;
      const lng = typeof loc.x === 'number' ? loc.x : loc.lng;

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        map.setView([lat, lng], Math.max(16, map.getZoom() || 0));
        onPick(lat, lng);
      }
    };

    map.on('geosearch/showlocation', onShow);
    return () => {
      try { map.removeControl(search as any); } catch {}
      map.off('geosearch/showlocation', onShow);
    };
  }, [map, onPick]);

  return null;
}

/* ========= Modal del mapa (responsivo) ========= */
function MapPickerModal({
  onConfirm, onOpenRef, initialCenter,
}: {
  onConfirm: (lat: number, lng: number) => void;
  onOpenRef: (open: () => void) => void;
  initialCenter?: { lat: number; lng: number };
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);

  // Icono tipo crosshair (SVG inline) para el marcador
  const crosshairIcon = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"
           viewBox="0 0 16 16" fill="#e53935" class="bi bi-crosshair">
        <path d="M8.5.5a.5.5 0 0 0-1 0v.518A7 7 0 0 0 1.018 7.5H.5a.5.5 0 0 0 0 1h.518A7 7 0  0 0 7.5 14.982v.518a.5.5 0 0 0 1 0v-.518A7 7 0 0 0 14.982 8.5h.518a.5.5 0 0 0 0-1h-.518A7 7 0 0 0 8.5 1.018zm-6.48 7A6 6 0 0 1 7.5 2.02v.48a.5.5 0 0 0 1 0v-.48a6 6 0 0 1 5.48 5.48h-.48a.5.5 0 0 0 0 1h.48a6 6 0 0 1-5.48 5.48v-.48a.5.5 0 0 0-1 0v.48A6 6 0 0 1 2.02 8.5h.48a.5.5 0 0 0 0-1zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>
      </svg>`;
    return L.divIcon({
      html: svg,
      className: 'leaflet-crosshair',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, []);

  useEffect(() => {
    const modalEl = modalRef.current;
    if (!modalEl) return;

    const modal = new window.bootstrap.Modal(modalEl, { backdrop: true, keyboard: true });

    const handleShown = () => {
      const mapInst = mapRef.current; // copia estable para evitar depender de la ref
      setTimeout(() => mapInst?.invalidateSize(), 60);
    };

    modalEl.addEventListener('shown.bs.modal', handleShown);

    onOpenRef(() => {
      setMarker(null);
      modal.show();
    });

    return () => {
      modalEl.removeEventListener('shown.bs.modal', handleShown);
      try { modal.hide(); } catch {}
    };
  }, [onOpenRef]);

  const center = initialCenter ?? { lat: 19.432608, lng: -99.133209 };

  return createPortal(
    <div className="modal fade" ref={modalRef} tabIndex={-1} aria-hidden="true" aria-labelledby="mapPickerTitle">
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl modal-fullscreen-sm-down animate__animated animate__fadeInUp">
        <div className="modal-content">
          <div className="modal-header">
            <h5 id="mapPickerTitle" className="modal-title">Selecciona una ubicación</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>

          <div className="modal-body map-modal-body">
            <MapContainer center={center as any} zoom={12} style={{ height: '100%', width: '100%' }}>
              <MapRefBridge mapRef={mapRef} />
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <SearchControl onPick={(lat, lng) => setMarker({ lat, lng })} />
              <ClickToMark onPick={(lat, lng) => setMarker({ lat, lng })} />
              {marker && (
                <Marker position={[marker.lat, marker.lng] as any} icon={crosshairIcon} />
              )}
            </MapContainer>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-light" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!marker}
              onClick={() => {
                if (!marker) return;
                onConfirm(marker.lat, marker.lng);
                const inst = window.bootstrap.Modal.getInstance(modalRef.current!);
                try { inst?.hide(); } catch {}
              }}
            >
              Usar estas coordenadas
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ========= Callout informativo ========= */
function CreateHint() {
  return (
    <div className="animate__animated animate__fadeIn">
      <div
        className="border rounded-3 p-3 d-flex align-items-start gap-3 flex-wrap"
        style={{
          background: 'linear-gradient(0deg, rgba(59,130,246,.06), rgba(59,130,246,.06)), #fff',
          borderColor: 'var(--line)',
        }}
      >
        <span
          className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
          style={{
            width: 36,
            height: 36,
            background: 'radial-gradient(closest-side, rgba(59,130,246,.18), rgba(59,130,246,.12))',
            color: '#2563eb',
          }}
        >
          <IconInfo />
        </span>
        <div className="small" style={{ minWidth: 220 }}>
          <div className="fw-bold mb-1">Registro de puntos</div>
          <div className="text-muted">
            Completa los campos del formulario. Usa <strong>Ver mapa</strong> para elegir
            las coordenadas con precisión. Al guardar, el formulario se limpia automáticamente.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========= Página ========= */
export default function CreatePage() {
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Clave para re-montar el formulario (limpia campos)
  const [formKey, setFormKey] = useState(0);

  const setCoordsRef = useRef<((lat: number, lng: number) => void) | null>(null);

  // Apertura del modal
  const openModalRef = useRef<() => void>(() => {});
  const bindOpen = (open: () => void) => { openModalRef.current = open; };

  const handleConfirmMap = (lat: number, lng: number) => {
    setCoordsRef.current?.(lat, lng);
  };

  const onSubmit = async (p: Point) => {
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
    const MIN_SPINNER_MS = 300;

    setSaving(true);
    const hold = delay(MIN_SPINNER_MS);

    try {
      await createPoint(p);

      setNotice({ type: 'success', message: 'Punto de Venta guardado exitosamente' });
      setFormKey(k => k + 1);
      setCoordsRef.current = null;
    } catch {
      setNotice({ type: 'error', message: 'Error al guardar, favor de contactar a soporte' });
    } finally {
      await hold;
      setSaving(false);
    }
  };

  const MapButton = useMemo(
    () => (
      <button
        type="button"
        className="btn btn-primary animate__animated animate__fadeInRight w-100 w-sm-auto"
        onClick={() => openModalRef.current?.()}
      >
        Ver mapa
      </button>
    ),
    []
  );

  return (
    <>
      <div className="grid animate__animated animate__fadeIn">
        <div className="card elevated animate__animated animate__fadeInUp">
          <h2 className="page-title mb-2">Registro de Punto de Venta</h2>
          <CreateHint />
        </div>

        <div className="card elevated animate__animated animate__fadeInUp">
          <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 justify-content-between mb-2">
            <h3 className="section-title m-0">Registra la información</h3>
            {MapButton}
          </div>

          <FormPoint
            key={formKey}
            onSubmit={onSubmit}
            bindSetCoords={(fn: (lat: number, lng: number) => void) => (setCoordsRef.current = fn)}
          />
        </div>
      </div>

      <MapPickerModal onConfirm={handleConfirmMap} onOpenRef={bindOpen} />

      {saving && <SavingOverlay text="Guardando…" />}
      {notice && <FloatingNotice notice={notice} onClose={() => setNotice(null)} />}
    </>
  );
}
