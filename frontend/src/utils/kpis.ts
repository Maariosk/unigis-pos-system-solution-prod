import type { Point } from '../api/points';

/* ================= Helpers numéricos ================= */

const isFiniteNumber = (n: any): n is number =>
  typeof n === 'number' && Number.isFinite(n);

const toNumber = (n: any): number => (n == null ? NaN : Number(n));

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

const average = (arr: number[]): number => {
  const vals = arr.filter(isFiniteNumber);
  return vals.length === 0 ? 0 : sum(vals) / vals.length;
};

const median = (arr: number[]): number => {
  const vals = arr.filter(isFiniteNumber).sort((a, b) => a - b);
  if (vals.length === 0) return 0;
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
};

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

/* ================= Helpers de dominio ================= */

const zoneOf = (p: any): string => p?.zoneName ?? p?.zone?.name ?? p?.zone ?? '';

const latOf = (p: any): number | null =>
  isFiniteNumber(p?.latitude) ? p.latitude : isFiniteNumber(p?.lat) ? p.lat : null;

const lngOf = (p: any): number | null =>
  isFiniteNumber(p?.longitude) ? p.longitude : isFiniteNumber(p?.lng) ? p.lng : null;

const toDate = (v: any): Date => (v instanceof Date ? v : new Date(v));
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
const inRange = (d: Date, a: Date, b: Date) => d >= a && d <= b;

const haversine = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number => {
  // distancia en metros
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

/* ================= Tipos públicos ================= */

export type DaySample = {
  date: string;   // 'YYYY-MM-DD'
  sales: number;  // suma de Sale ese día
  count: number;  // # de puntos creados ese día
};

export type DashboardKpis = {
  totalPoints: number;
  totalSales: number;
  avgTicket: number;          // compatibilidad
  avgSalePerPoint: number;    // nombre coherente
  activeZones: number;
  topPoint?: { id: number | string; desc: string; sale: number; zone: string };
  topZone?: { zone: string; total: number };
  week: { sales: number; count: number };
  prevWeek: { sales: number; count: number };
  deltas: { weekSalesPct: number; weekCountPct: number; avgTicketPct: number };
  today: { sales: number; count: number };
  todayUpdated: number;
  last7: DaySample[];
};

/* ================= Series de últimos N días ================= */

export function seriesLastNDays(points: Point[], n: number): DaySample[] {
  const today = startOfDay(new Date());
  const start = addDays(today, -(n - 1));

  // index por día
  const map: Record<string, DaySample> = {};
  for (let i = 0; i < n; i++) {
    const d = addDays(start, i);
    const key = d.toISOString().slice(0, 10);
    map[key] = { date: key, sales: 0, count: 0 };
  }

  (points || []).forEach((p: any) => {
    const created = toDate(p?.createdAt ?? p?.CreatedAt ?? new Date());
    if (!inRange(startOfDay(created), start, today)) return;
    const key = startOfDay(created).toISOString().slice(0, 10);
    const sale = Number(p?.sale ?? p?.Sale ?? 0) || 0;
    map[key].sales += sale;
    map[key].count += 1;
  });

  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

/* ================= KPI: Ventas ================= */

export function kpiVentas(points: Point[]) {
  const ventas = points
    .map((p: any) => toNumber(p?.sale ?? p?.Sale))
    .filter(isFiniteNumber)
    .filter((v) => v >= 0);

  const total = sum(ventas);
  const prom = ventas.length ? total / ventas.length : 0;
  const med = median(ventas);

  return { total, prom, med, count: ventas.length };
}

/* ================= KPI: Cobertura / Geodatos ================= */

type ZoneCentroid = {
  lat: number;
  lng: number;
  count: number;
  dispersionM: number; // promedio de distancia de cada punto 
};

export function kpiCobertura(points: Point[]) {
  const coords = points
    .map((p) => {
      const lat = latOf(p);
      const lng = lngOf(p);
      return lat != null && lng != null ? { lat, lng, raw: p } : null;
    })
    .filter(Boolean) as Array<{ lat: number; lng: number; raw: any }>;

  const pctConCoordenadas =
    points.length === 0 ? 0 : (coords.length / points.length) * 100;

  // NN promedio (metros)
  let avgNN = 0;
  if (coords.length >= 2) {
    const nnd: number[] = [];
    for (let i = 0; i < coords.length; i++) {
      let best = Infinity;
      for (let j = 0; j < coords.length; j++) {
        if (i === j) continue;
        const d = haversine(
          { lat: coords[i].lat, lng: coords[i].lng },
          { lat: coords[j].lat, lng: coords[j].lng }
        );
        if (d < best) best = d;
      }
      if (Number.isFinite(best)) nnd.push(best);
    }
    avgNN = average(nnd);
  }

  const byZone = new Map<string, any[]>();
  points.forEach((p) => {
    const z = zoneOf(p);
    if (!byZone.has(z)) byZone.set(z, []);
    byZone.get(z)!.push(p);
  });

  const zoneCentroids: Record<string, ZoneCentroid> = {};
  byZone.forEach((arr, z) => {
    const latVals = arr.map((p: any) => latOf(p)).filter(isFiniteNumber) as number[];
    const lngVals = arr.map((p: any) => lngOf(p)).filter(isFiniteNumber) as number[];
    if (latVals.length === 0 || lngVals.length === 0) {
      zoneCentroids[z] = { lat: 0, lng: 0, count: arr.length, dispersionM: 0 };
      return;
    }
    const lat = average(latVals);
    const lng = average(lngVals);
    const distances = arr
      .map((p: any) => {
        const la = latOf(p);
        const ln = lngOf(p);
        return la != null && ln != null
          ? haversine({ lat, lng }, { lat: la, lng: ln })
          : NaN;
      })
      .filter(isFiniteNumber);
    zoneCentroids[z] = {
      lat,
      lng,
      count: arr.length,
      dispersionM: average(distances),
    };
  });

  return { pctConCoordenadas, avgNN, zoneCentroids };
}

/* ================= KPI: Calidad de datos ================= */

export function kpiCalidad(points: Point[]) {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const in90d = 90 * DAY;

  const ages = points.map((p: any) => {
    const ts =
      (p?.updatedAt ? Date.parse(p.updatedAt) : NaN) ||
      (p?.createdAt ? Date.parse(p.createdAt) : NaN) ||
      (p?.UpdatedAt ? Date.parse(p.UpdatedAt) : NaN) ||
      (p?.CreatedAt ? Date.parse(p.CreatedAt) : NaN);
    const ageMs = Number.isFinite(ts) ? now - ts : NaN;
    return Number.isFinite(ageMs) ? ageMs / DAY : NaN;
  });

  const edadMediaDias = average(ages);

  const updated90 = points.filter((p: any) => {
    const ts =
      (p?.updatedAt ? Date.parse(p.updatedAt) : NaN) ||
      (p?.createdAt ? Date.parse(p.createdAt) : NaN) ||
      (p?.UpdatedAt ? Date.parse(p.UpdatedAt) : NaN) ||
      (p?.CreatedAt ? Date.parse(p.CreatedAt) : NaN);
    return Number.isFinite(ts) ? now - ts <= in90d : false;
  }).length;

  const pctUpdated90d = points.length === 0 ? 0 : (updated90 / points.length) * 100;

  const pctZonaValida =
    points.length === 0
      ? 0
      : (points.filter((p) => zoneOf(p).trim().length > 0).length / points.length) *
        100;

  const pctSaleValido =
    points.length === 0
      ? 0
      : (points.filter((p: any) => isFiniteNumber(toNumber(p?.sale ?? p?.Sale))).length /
          points.length) *
        100;

  return { edadMediaDias, pctUpdated90d, pctZonaValida, pctSaleValido };
}

/* ================= Dashboard KPIs coherentes con tu modelo ================= */

export function computeDashboard(points: Point[]): DashboardKpis {
  const clean = (points || []).map((p: any) => ({
    id: p?.id ?? p?.Id,
    desc: p?.description ?? p?.Description ?? '',
    sale: Number(p?.sale ?? p?.Sale ?? 0) || 0,
    zone: zoneOf(p) || '—',
    created: toDate(p?.createdAt ?? p?.CreatedAt ?? new Date()),
    updated: p?.updatedAt || p?.UpdatedAt ? toDate(p?.updatedAt ?? p?.UpdatedAt) : null,
  }));

  const totalPoints = clean.length;
  const totalSales = sum(clean.map((p) => p.sale));
  const avgTicket = totalPoints ? totalSales / totalPoints : 0; // compat
  const avgSalePerPoint = avgTicket;

  // Top punto
  const topPointRaw = clean.slice().sort((a, b) => b.sale - a.sale)[0];
  const topPoint = topPointRaw
    ? { id: topPointRaw.id, desc: topPointRaw.desc, sale: topPointRaw.sale, zone: topPointRaw.zone }
    : undefined;

  // Ventas por zona
  const zMap = new Map<string, { zone: string; total: number }>();
  clean.forEach((p) => {
    const row = zMap.get(p.zone) ?? { zone: p.zone, total: 0 };
    row.total += p.sale;
    zMap.set(p.zone, row);
  });
  const zSales = Array.from(zMap.values()).sort((a, b) => b.total - a.total);
  const topZone = zSales[0];
  const activeZones = zSales.length;

  // Ventanas temporales
  const todaySOD = startOfDay(new Date());
  const weekStart = addDays(todaySOD, -6);
  const prevWeekStart = addDays(todaySOD, -13);
  const prevWeekEnd = addDays(prevWeekStart, 6);

  const weekPts = clean.filter((p) => inRange(startOfDay(p.created), weekStart, todaySOD));
  const prevWeekPts = clean.filter((p) => inRange(startOfDay(p.created), prevWeekStart, prevWeekEnd));

  const weekSales = sum(weekPts.map((p) => p.sale));
  const prevWeekSales = sum(prevWeekPts.map((p) => p.sale));
  const weekCount = weekPts.length;
  const prevWeekCount = prevWeekPts.length;

  const pct = (cur: number, prev: number) =>
    prev <= 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;

  // Hoy (creados)
  const todayCreated = clean.filter((p) => sameDay(p.created, todaySOD));
  const today = { sales: sum(todayCreated.map((p) => p.sale)), count: todayCreated.length };

  // Hoy (actualizados)
  const todayUpdated = clean.filter((p) => p.updated && sameDay(p.updated!, todaySOD)).length;

  // Serie 7 días
  const last7 = seriesLastNDays(points, 7);

  return {
    totalPoints,
    totalSales,
    avgTicket,
    avgSalePerPoint,
    activeZones,
    topPoint,
    topZone,
    week: { sales: weekSales, count: weekCount },
    prevWeek: { sales: prevWeekSales, count: prevWeekCount },
    deltas: {
      weekSalesPct: pct(weekSales, prevWeekSales),
      weekCountPct: pct(weekCount, prevWeekCount),
      avgTicketPct: pct(avgSalePerPoint, prevWeekCount ? prevWeekSales / prevWeekCount : 0),
    },
    today,
    todayUpdated,
    last7,
  };
}
