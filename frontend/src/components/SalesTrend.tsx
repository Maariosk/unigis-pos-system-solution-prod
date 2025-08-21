import React, { useMemo } from 'react';
import type { Point } from '../api/points';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area
} from 'recharts';

type Props = { points: Point[] };

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

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
      <div style={{ fontWeight: 800, marginBottom: 4 }}>Día: {fmtDay(String(label))}</div>
      <div><span className="text-muted-2">Ventas totales</span> : {fmtMoney(v)}</div>
    </div>
  );
};

export default function SalesTrend({ points }: Props) {
  const data = useMemo(() => {
    const m = new Map<string, number>();
    points.forEach((p: any) => {
      const sale = Number(p?.sale);
      if (!Number.isFinite(sale)) return;
      const ts = Date.parse(p?.updatedAt ?? p?.createdAt ?? '');
      if (!Number.isFinite(ts)) return;
      const day = new Date(ts).toISOString().slice(0, 10); // YYYY-MM-DD
      m.set(day, (m.get(day) ?? 0) + sale);
    });
    return Array.from(m.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, totalSale]) => ({ date, totalSale }));
  }, [points]);

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
            <XAxis dataKey="date" tickFormatter={fmtDay} />
            <YAxis tickFormatter={(v) => fmtMoney(v)} width={90} />

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
