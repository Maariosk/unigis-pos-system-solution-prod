import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';

type Props = {
  initial?: { lat: number; lng: number };
  onClose: () => void;
  onConfirm: (coords: { lat: number; lng: number }) => void;
};

function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, map.getZoom(), { duration: 0.6 }); }, [center, map]);
  return null;
}

function ClickCapture({ onPick }: { onPick: (p: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); }
  });
  return null;
}

export default function MapPicker({ initial, onClose, onConfirm }: Props) {
  const [position, setPosition] = useState<{ lat: number; lng: number }>(
    initial ?? { lat: 19.432608, lng: -99.133209 } // CDMX default
  );
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const centerTuple = useMemo<[number, number]>(() => [position.lat, position.lng], [position]);

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    const data = await res.json();
    setResults(Array.isArray(data) ? data : []);
  };

  return (
    <>
      <div className="map-backdrop" onClick={onClose} />
      <div className="map-modal">
        <div className="window animate__animated animate__fadeInUp">
          {/* header con búsqueda */}
          <div className="header">
            <input
              className="form-control"
              placeholder="Buscar lugar, dirección o ciudad"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') search(query); }}
            />
            <button className="btn btn-primary" onClick={() => search(query)}>Buscar</button>
            <button className="btn btn-outline-light ms-auto" onClick={onClose}>Cerrar</button>
          </div>

          {/* mapa */}
          <div className="body">
            <MapContainer
              center={centerTuple}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyTo center={centerTuple} />
              <Marker position={centerTuple} />
              <ClickCapture onPick={(p) => setPosition(p)} />
            </MapContainer>


            {results.length > 0 && (
              <div className="results">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="result-item"
                    onClick={() => {
                      const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
                      setPosition({ lat, lng });
                      setResults([]);
                    }}
                  >
                    {r.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>


          <div className="p-2 d-flex gap-2 justify-content-end border-top border-dark">
            <div className="me-auto text-secondary small">
              Selecciona en el mapa o busca un lugar, luego confirma.
            </div>
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button
              className="btn btn-success"
              onClick={() => onConfirm(position)}
            >
              Confirmar selección
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
