import React, { useMemo } from 'react';
import type { Point } from '../api/points';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area
} from 'recharts';

type Props = { points: Point[] };

// $ MXN sin decimales
const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

// Nombre corto del mes en español
const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

// Clave de día "YYYY-MM-DD" para la ZONA HORARIA de CDMX (evita saltos por UTC)
const dayKeyCDMX = (isoLike: string | Date) => {
  const d = new Date(isoLike);
  // 'en-CA' => YYYY-MM-DD estable; fijamos tz CDMX
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
};

// Formato bonito para etiquetas a partir del key "YYYY-MM-DD"
const fmtDayKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS_ES[(m || 1) - 1]}`;
};

const Tip = ({ active, label, payload }: any) => {
  if (!active || !payload?.length) return null;
  const v = Number(payload[0]?.value ?? 0);
  return (
    <div
      className="shadow-sm"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: '8px 10px',
        color: 'var(--text)',
        minWidth: 160,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 4 }}>Día: {fmtDayKey(String(label))}</div>
      <div><span className="text-muted-2">Ventas totales</span> : {fmtMoney(v)}</div>
    </div>
  );
};

export default function SalesTrend({ points }: Props) {
  const data = useMemo(() => {
    const acc = new Map<string, number>();

    for (const p of (points ?? [])) {
      // tolera camelCase/PascalCase y string/number
      const saleRaw: any = (p as any).sale ?? (p as any).Sale;
      const dateRaw: any =
        (p as any).updatedAt ?? (p as any).UpdatedAt ??
        (p as any).createdAt ?? (p as any).CreatedAt;

      const sale = typeof saleRaw === 'string' ? parseFloat(saleRaw) : Number(saleRaw);
      if (!Number.isFinite(sale)) continue;
      if (!dateRaw) continue;

      const key = dayKeyCDMX(dateRaw); // YYYY-MM-DD en CDMX
      acc.set(key, (acc.get(key) ?? 0) + sale);
    }

    return Array.from(acc.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, totalSale]) => ({ date, totalSale }));
    // Profundidad: si mutan el mismo array, esto igual se recalcula
  }, [JSON.stringify(points)]);

  return (
    <div className="card elevated animate__animated animate__fadeInUp">
      <h3 className="section-title mb-2">Ventas por día</h3>
      <div style={{ height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={fmtDayKey} />
            <YAxis tickFormatter={(v) => fmtMoney(Number(v))} width={90} />
            <Tooltip content={<Tip />} />

            <Area
              type="monotone"
              dataKey="totalSale"
              name="Ventas totales"
              stroke="none"
              fill="url(#gradSale)"
              isAnimationActive
            />
            <Line
              type="monotone"
              dataKey="totalSale"
              name="Ventas totales"
              stroke="#06b6d4"
              strokeWidth={3}
              dot={{ r: 3, className: 'chart-pulse' }}
              activeDot={{ r: 5 }}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
