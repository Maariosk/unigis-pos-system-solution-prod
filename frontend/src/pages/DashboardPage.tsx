import React, { useEffect, useMemo, useState } from 'react';
import { Point, SalesByZone, listPoints, salesByZone } from '../api/points';
import MapView from '../components/MapView';
import SalesPie from '../components/SalesPie';
import SalesBar from '../components/SalesBar'; // <— ahora es SOLO el chart (sin card)
import PointsCountBar from '../components/PointsCountBar';
import SalesTrend from '../components/SalesTrend';
import TopPointsBar from '../components/TopPointsBar';

// === KPIs ===
import KPICard from '../components/KPICard';
import { kpiVentas, kpiCobertura } from '../utils/kpis';

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function DashboardPage() {
  const [points, setPoints] = useState<Point[]>([]);
  const [zones, setZones] = useState<SalesByZone[]>([]);
  const [donutInfo, setDonutInfo] = useState<{ zone: string; totalSale: number } | null>(null);

  useEffect(() => {
    (async () => {
      setPoints(await listPoints(1, 200));
      setZones(await salesByZone());
    })();
  }, []);

  // === KPIs (memoizados) ===
  const ventas = useMemo(() => kpiVentas(points), [points]);
  const geo    = useMemo(() => kpiCobertura(points), [points]);

  const zonasActivas = useMemo(() => {
    const set = new Set(
      points
        .map((p: any) => p?.zoneName ?? p?.zone?.name ?? p?.zone ?? '')
        .map((z) => String(z).trim())
        .filter(Boolean)
    );
    return set.size;
  }, [points]);

  const zonaTop = useMemo(() => {
    if (!zones?.length) return null;
    return zones.reduce((best, z) => (z.totalSale > best.totalSale ? z : best), zones[0]);
  }, [zones]);

  const zonesClean = useMemo(
    () =>
      (zones ?? []).map((z: any) => ({
        zone: (z.zone ?? z.Zone ?? 'Sin zona').toString(),
        count: Number(z.count ?? z.points ?? 0),
        totalSale: Number(z.totalSale ?? 0),
      })),
    [zones]
  );

  // Cambio activo de la dona
  const handleActiveChange = (info: { zone: string; totalSale: number } | null) => {
    setDonutInfo((prev) => (prev?.zone === info?.zone && prev?.totalSale === info?.totalSale ? prev : info));
  };

  return (
    <div className="container">
      {/* MAPA */}
      <div className="row">
        <div className="col-12 mb-3">
          <div className="animate__animated animate__fadeInUp animate__faster">
            <MapView points={points} />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="row kpi-row">
        <div className="col-12 col-sm-6 col-xl-4 mb-3">
          <div className="kpi kpi-sky animate__animated animate__fadeInUp">
            <KPICard title="Puntos" value={String(points.length)} sub="Registros en Puntos" />
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-4 mb-3">
          <div className="kpi kpi-emerald animate__animated animate__fadeInUp animate__delay-1s">
            <KPICard title="Venta total" value={fmtMoney(ventas.total)} sub="Suma del campo Venta" />
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-4 mb-3">
          <div className="kpi kpi-indigo animate__animated animate__fadeInUp animate__delay-2s">
            <KPICard title="Venta promedio por punto" value={fmtMoney(ventas.prom)} sub={`Mediana ${fmtMoney(ventas.med)}`} />
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-4 mb-3">
          <div className="kpi kpi-amber animate__animated animate__fadeInUp">
            <KPICard title="Zonas activas" value={String(zonasActivas)} sub="Zonas con al menos un punto" />
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-4 mb-3">
          <div className="kpi kpi-violet animate__animated animate__fadeInUp animate__delay-1s">
            <KPICard title="Zona TOP por venta" value={zonaTop ? fmtMoney(zonaTop.totalSale) : '—'} sub={zonaTop ? zonaTop.zone : 'Sin datos'} />
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-4 mb-3">
          <div className="kpi kpi-rose animate__animated animate__fadeInUp animate__delay-2s">
            <KPICard title="Registros con coordenadas" value={`${geo.pctConCoordenadas.toFixed(0)}%`} sub={`Distancia media al PV más cercano ${(geo.avgNN / 1000).toFixed(2)} km`} />
          </div>
        </div>
      </div>

      {donutInfo && (
        <div className="row">
          <div className="col-12 mb-2">
            <div className="tb-chip chip-glow animate__animated animate__fadeIn">
              <strong>{donutInfo.zone}</strong>
              <span className="text-muted mx-1">·</span>
              {fmtMoney(donutInfo.totalSale)}
            </div>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-12 col-lg-5 mb-3">
          <div className="card elevated equal animate__animated animate__fadeInUp">
            <h3 className="section-title">Ventas por Zona (Donut)</h3>
            <div className="fill">
              <SalesPie data={zonesClean} onActiveChange={handleActiveChange} />
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-7 mb-3">
          <div className="card elevated equal animate__animated animate__fadeInUp">
            <h3 className="section-title">Ventas por Zona (Puntos + Línea)</h3>
            <div className="fill">
              <SalesBar data={zonesClean as any} />
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12 col-lg-6 mb-3">
          <SalesTrend points={points} />
        </div>
        <div className="col-12 col-lg-6 mb-3">
          <TopPointsBar points={points} />
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <PointsCountBar points={points} />
        </div>
      </div>
    </div>
  );
}
