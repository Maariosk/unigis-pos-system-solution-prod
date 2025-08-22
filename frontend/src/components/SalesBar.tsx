import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';

type Item = { zone: string; totalSale: number; count?: number };

const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#60a5fa', '#f472b6', '#ef4444', '#10b981'];
const LINE_COLOR = '#334155';

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const XTickWrap = (props: any) => {
  const { x, y, payload } = props;
  const text: string = String(payload?.value ?? '');
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach((w) => {
    if ((line + ' ' + w).trim().length > 10) {
      if (line) lines.push(line);
      line = w;
    } else line = (line ? line + ' ' : '') + w;
  });
  if (line) lines.push(line);
  const dyStart = lines.length === 1 ? 16 : lines.length === 2 ? 10 : 6;

  return (
    <text x={x} y={y} textAnchor="middle" fill="#475569">
      {lines.map((ln, i) => (
        <tspan key={i} x={x} dy={i === 0 ? dyStart : 14}>
          {ln}
        </tspan>
      ))}
    </text>
  );
};

const PulsingDot = (props: any) => {
  const { cx, cy, fill } = props;
  const r = 5;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <circle cx={cx} cy={cy} r={r} stroke={fill} strokeWidth={3} fill="none" className="chart-pulse" />
    </g>
  );
};

const Tip = ({ active, label, payload }: any) => {
  if (!active || !payload?.length) return null;
  const venta = Number(
    payload.find((p: any) => p?.name === 'Venta' || p?.dataKey === 'totalSale')?.value ?? 0
  );

  return (
    <div
      className="shadow-sm"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: '8px 10px',
        color: 'var(--text)',
        minWidth: 140,
        boxShadow: 'var(--shadow)',
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 4 }}>{String(label)}</div>
      <div><span className="text-muted-2">Venta</span> : {fmtMoney(venta)}</div>
      <div><span className="text-muted-2">Zona</span> : {String(label)}</div>
    </div>
  );
};

function SalesBar({
  data,
  height,
  aspect = 2,           
  minHeight = 220,      
}: {
  data: Item[];
  height?: number;
  aspect?: number;
  minHeight?: number;
}) {
  const sorted = useMemo(() => [...(data ?? [])].sort((a, b) => b.totalSale - a.totalSale), [data]);

  if (!sorted.length) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 300 }}>
        Sin datos para mostrar
      </div>
    );
    }

  // Props responsivos para ResponsiveContainer
  const containerProps: any = { width: '100%', debounce: 50 };
  if (typeof height === 'number' && height > 0) {
    containerProps.height = height;
  } else {
    containerProps.aspect = aspect;
    containerProps.minHeight = minHeight;
  }

  return (
    <ResponsiveContainer {...containerProps}>
      <ComposedChart data={sorted} margin={{ top: 18, right: 28, bottom: 28, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="zone"
          tickMargin={10}
          interval={0}
          height={48}       
          tick={<XTickWrap />}
        />
        <YAxis tickFormatter={(v: number) => fmtMoney(v).replace('MXN ', '')} />

        <Tooltip content={<Tip />} />
        <Legend />

        <Line
          type="monotone"
          dataKey="totalSale"
          name="Venta"
          stroke={LINE_COLOR}
          strokeWidth={2.5}
          dot={false}
          isAnimationActive
          animationBegin={120}
          animationDuration={700}
        />

        <Scatter
          dataKey="totalSale"
          name=""
          legendType="none"
          shape={<PulsingDot />}
          isAnimationActive
        >
          {sorted.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Scatter>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export default React.memo(SalesBar);