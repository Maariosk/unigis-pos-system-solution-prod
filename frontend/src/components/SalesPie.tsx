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

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <text x={cx} y={cy} dy={-6} textAnchor="middle" fontWeight={700}>
        {payload.zone}
      </text>
      <text x={cx} y={cy} dy={14} textAnchor="middle" fill="#6b7280" fontSize={12}>
        {fmtMoney(value)}
      </text>
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
    </g>
  );
};

function SalesPieComp({ data, onActiveChange }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const clean = useMemo(
    () => (data ?? []).filter((d) => d && typeof d.totalSale === 'number' && d.totalSale > 0),
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
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default React.memo(SalesPieComp);
