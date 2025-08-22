import React, { useMemo, useRef, useState, useEffect } from 'react';
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

/** Etiqueta del eje X con envoltura y límite de líneas */
const XTickWrap = (props: any) => {
  const { x, y, payload, maxChars = 10, maxLines = 3, fontSize = 12 } = props;
  const text: string = String(payload?.value ?? '');

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';

  words.forEach((w) => {
    const candidate = (line ? line + ' ' : '') + w;
    if (candidate.length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);

  // recorta a maxLines y agrega elipsis si sobran
  const limited = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    limited[maxLines - 1] = limited[maxLines - 1].replace(/.{1}$/, '…');
  }

  const dyStart = limited.length === 1 ? 16 : limited.length === 2 ? 10 : 6;

  return (
    <text x={x} y={y} textAnchor="middle" fill="#475569" fontSize={fontSize}>
      {limited.map((ln, i) => (
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

/** Hook mínimo para conocer el ancho del contenedor */
function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      setW(cr.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width: w };
}

function SalesBar({
  data,
  height, // si lo pasas, manda; si no, calculamos en base al ancho
}: {
  data: Item[];
  height?: number;
}) {
  const sorted = useMemo(() => [...(data ?? [])].sort((a, b) => b.totalSale - a.totalSale), [data]);
  const { ref, width } = useContainerWidth();

  if (!sorted.length) {
    return (
      <div ref={ref} className="d-flex align-items-center justify-content-center text-muted" style={{ height: height ?? 300 }}>
        Sin datos para mostrar
      </div>
    );
  }

  // Breakpoints simples
  const narrow = width > 0 && width <= 480;        // teléfonos
  const medium = width > 480 && width <= 768;      // tablets chicas

  // Altura dinámica si no pasas height
  const autoHeight = height ?? (narrow ? 360 : medium ? 320 : 300);

  // Ajustes responsivos
  const xTickFont = narrow ? 11 : 12;
  const xTickChars = narrow ? 8 : 10;
  const xTickLines = narrow ? 3 : 3;               // máximo 3 líneas
  const xAxisHeight = narrow ? 68 : 50;
  const bottomMargin = narrow ? 80 : 56;
  const legendHeight = 20;
  const legendAlign = narrow ? 'center' : 'left';
  const legendVAlign = 'top';
  const xInterval: any = narrow ? 'preserveStartEnd' : 0; // reduce densidad en móvil

  // dominio Y con “aire”
  const yDomain: [number, any] = [0, (dataMax: number) => Math.ceil(dataMax * 1.15)];

  return (
    <div ref={ref} style={{ width: '100%', height: autoHeight }}>
      <ResponsiveContainer width="100%" height="100%" debounce={60}>
        <ComposedChart data={sorted} margin={{ top: 36, right: 16, bottom: bottomMargin, left: 12 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <Legend
            verticalAlign={legendVAlign}
            align={legendAlign as any}
            height={legendHeight}
            iconType="plainline"
            wrapperStyle={{ lineHeight: `${legendHeight}px` }}
          />
          <XAxis
            dataKey="zone"
            interval={xInterval}
            tickMargin={8}
            height={xAxisHeight}
            tick={
              <XTickWrap maxChars={xTickChars} maxLines={xTickLines} fontSize={xTickFont} />
            }
            scale="point"
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            domain={yDomain}
            padding={{ top: 8 }}
            tickFormatter={(v: number) => fmtMoney(v).replace('MXN ', '')}
            width={narrow ? 54 : 60}
          />

          <Tooltip content={<Tip />} />

          <Line
            type="monotone"
            dataKey="totalSale"
            name="Venta"
            stroke={LINE_COLOR}
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={false}
            isAnimationActive
            animationBegin={120}
            animationDuration={700}
          />

          <Scatter dataKey="totalSale" name="" legendType="none" shape={<PulsingDot />} isAnimationActive>
            {sorted.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Scatter>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default React.memo(SalesBar);