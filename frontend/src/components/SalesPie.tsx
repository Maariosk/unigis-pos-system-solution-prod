import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Legend, ResponsiveContainer, Cell, Sector } from 'recharts';

type Item = { zone: string; totalSale: number };
type Props = {
  data: Item[];
  onActiveChange?: (info: { zone: string; totalSale: number } | null) => void;
};

const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#60a5fa', '#f472b6', '#ef4444', '#10b981'];

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

// Trunca visualmente; el valor completo va en <title> (tooltip nativo SVG)
const truncate = (s: string, max = 22) => (s.length > max ? s.slice(0, max - 1) + '…' : s);

// Dibujo del sector activo + textos centrados
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  const zone: string = String(payload?.zone ?? 'Sin zona');
  const amount = fmtMoney(Number(value) || 0);

  // Tamaño de fuente adaptativo: limita entre 12–18 y corrige por longitud
  const len = zone.length;
  const baseFromRadius =
    typeof innerRadius === 'number' ? Math.max(12, Math.min(18, innerRadius * 0.22)) : 16;
  const titleSize = len <= 12 ? baseFromRadius : len <= 18 ? baseFromRadius - 2 : baseFromRadius - 4;

  return (
    <g>
      {/* Sector activo + halo (debajo del texto) */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 12}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.25}
      />

      {/* Texto central (encima) */}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontWeight: 800, fontSize: titleSize, fill: 'var(--text, #111827)' }}
        pointerEvents="none"
        aria-label={zone}
      >
        <title>{zone}</title>
        <tspan>{truncate(zone, 22)}</tspan>
      </text>

      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 12, fill: 'var(--text, #111827)', opacity: 0.9 }}
        pointerEvents="none"
      >
        {amount}
      </text>
    </g>
  );
};

function SalesPieComp({ data, onActiveChange }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const clean = useMemo(
    () =>
      (data ?? [])
        .filter((d) => d && typeof d.totalSale === 'number' && d.totalSale > 0)
        .map((d) => ({ zone: String(d.zone ?? 'Sin zona'), totalSale: Number(d.totalSale || 0) })),
    [data]
  );

  if (!clean.length) {
    return (
      <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: 300 }}>
        Sin datos para mostrar
      </div>
    );
  }

  const pieActiveProps = { activeIndex, activeShape: renderActiveShape } as any;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={clean}
          dataKey="totalSale"
          nameKey="zone"
          cx="50%"
          cy="50%"
          innerRadius="45%"
          outerRadius="68%"
          paddingAngle={2}
          minAngle={2}              // evita gajos imperceptibles
          cornerRadius={4}          // bordes más limpios
          isAnimationActive
          animationBegin={120}
          animationDuration={800}
          onMouseEnter={(_, i: number) => {
            setActiveIndex(i);
            const item = clean[i];
            onActiveChange?.(item ? { zone: item.zone, totalSale: item.totalSale } : null);
          }}
          onMouseLeave={() => onActiveChange?.(null)}
          {...pieActiveProps}
        >
          {clean.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>

        <Legend
          layout="horizontal"
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ paddingTop: 8 }}
          iconType="circle"
          formatter={(value: string) => (
            <span
              title={value}
              style={{
                display: 'inline-block',
                maxWidth: 140,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                verticalAlign: 'middle',
              }}
            >
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default React.memo(SalesPieComp);