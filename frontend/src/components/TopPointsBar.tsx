import React, { useMemo, useRef, useEffect, useState } from 'react';
import type { Point } from '../api/points';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, Cell,
} from 'recharts';

type Props = { points: Point[] };

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

const PALETTE = ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#3b82f6','#f43f5e','#84cc16','#06b6d4'];

// Hash + color estable por nombre (evita que cambie el color si cambia el orden)
const hash = (s: string) => s.split('').reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0) | 0, 0);
const colorFor = (key: string) => PALETTE[Math.abs(hash(key)) % PALETTE.length];

// === Hook: ancho del contenedor (ResizeObserver) ===
function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setW(cr.width);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, width: w };
}

export default function TopPointsBar({ points }: Props) {
  const data = useMemo(() => {
    const rows = points
      .map((p: any) => ({
        name: String(p?.description ?? 's/n'),
        sale: Number(p?.sale) || 0,
      }))
      .sort((a, b) => b.sale - a.sale)
      .slice(0, 5)
      .reverse(); // mayor arriba en layout vertical
    return rows;
  }, [points]);

  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const isXS = width > 0 && width < 420;
  const isSM = width >= 420 && width < 640;

  // Config responsive
  const yWidth = isXS ? 110 : isSM ? 140 : 160;
  const barSize = isXS ? 14 : isSM ? 18 : 24;
  const barGap  = isXS ? '38%' : isSM ? '30%' : '26%';
  const hideValueLabels = isXS; 
  const leftMargin = 8;
  const rightMargin = isXS ? 8 : 18;

  const maxChars = isXS ? 14 : isSM ? 22 : 32;
  const YTick = (props: any) => {
    const { x, y, payload } = props;
    const full: string = String(payload?.value ?? '');
    const short = full.length > maxChars ? full.slice(0, maxChars - 1) + '…' : full;
    return (
      <text x={x} y={y} textAnchor="end" fill="#475569">
        <title>{full}</title>
        <tspan dx={-4} dy={4}>{short}</tspan>
      </text>
    );
  };

  return (
    <div className="card elevated animate__animated animate__fadeInUp top5-chart">
      <h3 className="section-title mb-2">Top 5 puntos por venta</h3>
      <div ref={ref} style={{ height: 300 }}>
        {!data.length ? (
          <div className="d-flex align-items-center justify-content-center h-100 text-muted">
            Sin datos para mostrar
          </div>
        ) : (
          <ResponsiveContainer>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: rightMargin, left: leftMargin, bottom: 0 }}
              barCategoryGap={barGap}
            >
              <defs>
                {data.map((d, i) => {
                  const c = colorFor(d.name);
                  return (
                    <linearGradient id={`tp-grad-${i}`} key={`tp-${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={c} stopOpacity={0.82} />
                      <stop offset="100%" stopColor={c} stopOpacity={1} />
                    </linearGradient>
                  );
                })}
              </defs>

              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => fmtMoney(v)} />
              <YAxis type="category" dataKey="name" width={yWidth} tick={YTick} />
              <Tooltip formatter={(v: any) => fmtMoney(Number(v))} />

              <Bar
                dataKey="sale"
                name="Ventas"
                isAnimationActive
                animationBegin={140}
                animationDuration={650}
                radius={[0, 10, 10, 0]}
                barSize={barSize}
                background={{ fill: '#f3f4f6' }}
              >
                {data.map((d, i) => (
                  <Cell key={d.name} fill={`url(#tp-grad-${i})`} />
                ))}

                {!hideValueLabels && (
                  <LabelList
                    dataKey="sale"
                    position="right"
                    formatter={(v: any) => fmtMoney(Number(v))}
                    style={{ fill: '#374151', fontSize: isXS ? 11 : 12 }}
                  />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
