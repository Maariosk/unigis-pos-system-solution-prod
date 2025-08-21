import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
  Cell,
} from 'recharts';
import type { Point } from '../api/points';

const PALETTE = ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#3b82f6','#f43f5e','#84cc16','#06b6d4'];

const zoneOf = (p: any): string =>
  (p?.zoneName ?? p?.zone?.name ?? p?.zone ?? 'Sin zona')?.toString().trim() || 'Sin zona';

const hash = (s: string) => s.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0) | 0, 0);
const colorFor = (key: string) => PALETTE[Math.abs(hash(key)) % PALETTE.length];

function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      setWidth(w);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

const CountLabel = (props: any) => {
  const { x = 0, y = 0, width = 0, height = 0, value } = props;
  const num = typeof value === 'number' ? value : Number(value ?? 0);
  const visible = width > 16;
  return (
    <text
      x={x + width + 8}
      y={y + height / 2}
      textAnchor="start"
      dominantBaseline="central"
      fill="#374151"
      fontSize={12}
    >
      {visible ? num : ''}
    </text>
  );
};

const Tip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const v = payload[0].value;
    return (
      <div
        className="shadow-sm"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: '8px 10px',
          color: 'var(--text)',
          minWidth: 120,
          boxShadow: 'var(--shadow)',
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 2 }}>{label}</div>
        <div className="text-muted-2" style={{ fontSize: 12 }}>Puntos</div>
        <div style={{ fontWeight: 700 }}>{v}</div>
      </div>
    );
  }
  return null;
};

type Props = {
  points: Point[];
  wrap?: boolean;
  showTitle?: boolean;
  title?: string;
};

function PointsCountBarComp({
  points,
  wrap = true,
  showTitle = true,
  title = 'Puntos por zona',
}: Props) {
  const data = useMemo(() => {
    const m = new Map<string, number>();
    points.forEach((p) => {
      const z = zoneOf(p);
      m.set(z, (m.get(z) ?? 0) + 1);
    });
    return Array.from(m, ([zone, count]) => ({ zone, count })).sort((a, b) => b.count - a.count);
  }, [points]);

  const uid = useMemo(() => Math.random().toString(36).slice(2), []);

  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const isXS = width > 0 && width < 420;
  const isSM = width >= 420 && width < 640;

  const baseYAxis = useMemo(() => {
    const maxLen = data.reduce((acc, d) => Math.max(acc, (d.zone || '').length), 0);
    return Math.max(70, Math.min(220, maxLen * 8 + 20));
  }, [data]);
  const yAxisWidth = isXS ? Math.min(baseYAxis, 120) : isSM ? Math.min(baseYAxis, 160) : baseYAxis;

  const maxChars = isXS ? 14 : isSM ? 22 : 32;
  const YTick = (props: any) => {
    const { x, y, payload } = props;
    const full: string = String(payload?.value ?? '');
    const short = full.length > maxChars ? full.slice(0, maxChars - 1) + '…' : full;
    return (
      <text x={x} y={y} textAnchor="end" fill="#334155">
        <title>{full}</title>
        <tspan dx={-4} dy={4}>{short}</tspan>
      </text>
    );
  };

  const barSize = isXS ? 16 : isSM ? 20 : 22;
  const barGap  = isXS ? '36%' : isSM ? '30%' : '26%';
  const rightMargin = isXS ? 12 : 28;
  const leftMargin  = 8;

  const chart = !data.length ? (
    <div className="d-flex align-items-center justify-content-center h-100 text-muted">
      Sin datos para mostrar
    </div>
  ) : (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 18, right: rightMargin, bottom: 12, left: leftMargin }}
        barCategoryGap={barGap}
      >
        <defs>
          {data.map((d, i) => {
            const c = colorFor(d.zone);
            return (
              <linearGradient id={`pcz-grad-${uid}-${i}`} key={`g-${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={c} stopOpacity={0.82} />
                <stop offset="100%" stopColor={c} stopOpacity={1} />
              </linearGradient>
            );
          })}
        </defs>

        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: '#334155', fontSize: isXS ? 11 : 12 }}
          axisLine={{ stroke: 'var(--line)' }}
        />
        <YAxis
          type="category"
          dataKey="zone"
          width={yAxisWidth}
          tickMargin={8}
          tick={YTick}
          axisLine={{ stroke: 'var(--line)' }}
        />
        <Tooltip cursor={{ fill: 'rgba(15,23,42,.06)' }} content={<Tip />} />

        <Bar
          dataKey="count"
          name="Puntos"
          isAnimationActive
          animationBegin={140}
          animationDuration={650}
          radius={[0, 10, 10, 0]}
          background={{ fill: '#f3f4f6' }}
          barSize={barSize}
        >
          {data.map((_, i) => <Cell key={i} fill={`url(#pcz-grad-${uid}-${i})`} />)}
          <LabelList dataKey="count" position="right" content={<CountLabel />} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (!wrap) return chart;

  return (
    <div className="card equal elevated animate__animated animate__fadeInUp points-zone-chart">
      {showTitle && <h3 className="section-title">{title}</h3>}
      <div className="fill" ref={ref}>{chart}</div>
    </div>
  );
}

export default React.memo(PointsCountBarComp);
