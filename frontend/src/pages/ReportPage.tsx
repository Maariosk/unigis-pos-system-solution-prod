import { useEffect, useMemo, useState } from 'react';
import { listPoints, Point } from '../api/points';
import PointsTable from '../components/PointsTable';

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(n);

export default function ReportPage(){
  const [data, setData] = useState<Point[]>([]);
  const [q, setQ] = useState('');
  const [zone, setZone] = useState<string>('');

  useEffect(() => {
    (async () => setData(await listPoints(1, 1000)))();
  }, []);

  const zones = useMemo(
    () => Array.from(new Set(data.map(d => (d as any)?.zone ?? 'Sin zona'))).sort(),
    [data]
  );

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return data.filter(d =>
      (!text || d.description.toLowerCase().includes(text) || String(d.id).includes(text)) &&
      (!zone || (d as any).zone === zone)
    );
  }, [data, q, zone]);

  const total = useMemo(() => filtered.reduce((acc, x) => acc + Number(x.sale || 0), 0), [filtered]);

  const exportCsv = () => {
    const rows = [
      ['ID','Descripción','Zona','Venta','Lat','Lng'],
      ...filtered.map(p => [p.id, p.description, (p as any).zone, p.sale, p.latitude, p.longitude]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_puntos_venta.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid animate__animated animate__fadeIn">
      <div className="card elevated animate__animated animate__fadeInDown">
        <h2 className="page-title">Reporte General</h2>
        <p className="subtitle">Consulta, filtra y exporta todos los puntos de venta.</p>

        <div className="row gy-2 gx-2 align-items-stretch align-items-md-center mb-3 animate__animated animate__fadeInUp animate__delay-1s">
          <div className="col-12 col-md-4 col-lg-3">
            <input
              className="input w-100"
              placeholder="Buscar por ID o descripción…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-3 col-lg-2">
            <select className="select w-100" value={zone} onChange={e => setZone(e.target.value)}>
              <option value="">Todas las zonas</option>
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div className="col-12 col-sm-6 col-md-auto">
            <button className="btn btn-primary w-100 w-md-auto" onClick={exportCsv}>
              Exportar CSV
            </button>
          </div>

          <div className="col-12 col-md text-md-end">
            <div className="text-muted">
              Registros: <b>{filtered.length}</b> — Total vendido: <b>{fmtMoney(total)}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="animate__animated animate__fadeInUp animate__delay-2s">
        <PointsTable
          key={`${q}|${zone}`}  // re-animación suave al filtrar
          data={filtered}
          showEdit={false}
          showDelete={false}
        />
      </div>
    </div>
  );
}
