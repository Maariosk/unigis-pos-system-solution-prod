import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';

type Props = {
  userName?: string;
  siteName?: string;
};

type Crumb = { label: string; to?: string };

const ROUTE_TITLES: Record<string, string> = {
  '/crear': 'Registro',
  '/eliminar': 'Baja',
  '/editar': 'Modificación',
  '/reporte': 'Sabana de datos',
  '/dashboard': 'Dashboard',
};

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="tb-ico" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V22h19.2v-2.8c0-3.2-6.4-4.8-9.6-4.8z"
    />
  </svg>
);

const PinIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="tb-ico" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5z"
    />
  </svg>
);

export default function TopBar({ userName, siteName }: Props) {
  const { pathname } = useLocation();

  const trail = useMemo<Crumb[]>(() => {
    const title = ROUTE_TITLES[pathname] ?? '';
    const arr: Crumb[] = [{ label: 'Inicio', to: '/crear' }];
    if (title) arr.push({ label: title });
    return arr;
  }, [pathname]);

  const current = trail[trail.length - 1]?.label ?? 'Inicio';

  return (
    <div className="topbar" role="banner">
      <Link to="/crear" className="brand" aria-label="Ir a inicio">
        <img
          src="/pv-logo-mark.svg"
          alt="Punto de Venta"
          className="brand-logo"
          style={{ height: 22, display: 'block' }}
        />
      </Link>

      <nav className="breadcrumbs d-none d-sm-flex" aria-label="Breadcrumb">
        {trail.map((c, i) => {
          const isLast = i === trail.length - 1;
          return (
            <span className="crumb" key={i}>
              {i > 0 && <span className="crumb-sep">››</span>}
              {c.to && !isLast ? (
                <Link to={c.to}>{c.label}</Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{c.label}</span>
              )}
            </span>
          );
        })}
      </nav>

      <div
        className="d-inline d-sm-none"
        style={{
          marginLeft: 8,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        aria-label="Página actual"
      >
        {current}
      </div>

      <div className="tb-status ms-auto">
        {userName && (
          <span className="tb-chip" title={userName}>
            <UserIcon />
            <span className="tb-text d-none d-lg-inline">{userName}</span>
          </span>
        )}
        {siteName && (
          <span className="tb-chip" title={siteName}>
            <PinIcon />
            <span className="tb-text d-none d-lg-inline">{siteName}</span>
          </span>
        )}
      </div>
    </div>
  );
}
