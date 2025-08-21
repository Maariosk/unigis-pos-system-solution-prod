type Props = {
  title: string;
  value: string;
  sub?: string;
};

export default function KPICard({ title, value, sub }: Props) {
  return (
    <div className="card animate__animated animate__fadeInUp">
      <div className="subtitle">{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      {sub && <div className="text-muted-2" style={{ marginTop: 6 }}>{sub}</div>}
    </div>
  );
}
