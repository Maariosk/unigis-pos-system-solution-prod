import type { Point } from '../api/points';

type Props = {
  data: Point[];
  onEdit?: (p: Point) => void;
  onDelete?: (id: number) => void;
  showEdit?: boolean;
  showDelete?: boolean;
};

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Normalizadores para soportar múltiples formas del backend
const zoneOf = (p: any): string => p?.zoneName ?? p?.zone?.name ?? p?.zone ?? '';
const latOf = (p: any): number | null =>
  typeof p?.latitude === 'number' ? p.latitude : typeof p?.lat === 'number' ? p.lat : null;
const lngOf = (p: any): number | null =>
  typeof p?.longitude === 'number' ? p.longitude : typeof p?.lng === 'number' ? p.lng : null;

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm18.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.99-1.66z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M9 3v1H4v2h16V4h-5V3H9zm1 6h2v9h-2V9zm-4 0h2v9H6V9zm8 0h2v9h-2V9z"
    />
  </svg>
);

export default function PointsTable({
  data,
  onEdit,
  onDelete,
  showEdit = true,
  showDelete = true,
}: Props) {
  const hasActions = showEdit || showDelete;

  if (data.length === 0) {
    return (
      <div className="card table-card points-table animate__animated animate__fadeInUp">
        <h3 className="section-title">Listado</h3>
        <div className="text-muted-2">Sin registros</div>
      </div>
    );
  }

  return (
    <div className="card table-card points-table animate__animated animate__fadeInUp">
      <h3 className="section-title">Listado</h3>

      <div className="table-wrap d-none d-md-block">
        <table className="table">
          <colgroup>
            <col className="col-id" />
            <col className="col-desc" />
            <col className="col-zone" />
            <col className="col-money" />
            <col className="col-lat" />
            <col className="col-lng" />
            {hasActions && <col className="col-actions" />}
          </colgroup>

          <thead>
            <tr>
              <th>ID</th>
              <th>Descripción</th>
              <th>Zona</th>
              <th className="num">Venta</th>
              <th className="num">Lat</th>
              <th className="num">Lng</th>
              {hasActions && <th className="actions">Acciones</th>}
            </tr>
          </thead>

          <tbody>
            {data.map((p: any) => {
              const lat = latOf(p);
              const lng = lngOf(p);
              const zone = zoneOf(p);
              const sale = Number(p?.sale ?? 0);

              return (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td className="cell-ellipsis" title={p?.description ?? ''}>
                    {p?.description}
                  </td>
                  <td className="cell-zone">{zone}</td>
                  <td className="num">{money.format(sale)}</td>
                  <td className="num">{lat != null ? lat.toFixed(5) : ''}</td>
                  <td className="num">{lng != null ? lng.toFixed(5) : ''}</td>

                  {hasActions && (
                    <td className="actions">
                      <div className="actions-wrap">
                        {showEdit && onEdit && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => onEdit(p)}
                            aria-label={`Editar punto ${p.id}`}
                          >
                            <EditIcon /> Editar
                          </button>
                        )}

                        {showDelete && onDelete && (
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => onDelete(p.id)}
                            aria-label={`Eliminar punto ${p.id}`}
                          >
                            <TrashIcon /> Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ====== Vista TARJETAS (móvil) ====== */}
      <div className="d-block d-md-none">
        {data.map((p: any, i) => {
          const lat = latOf(p);
          const lng = lngOf(p);
          const zone = zoneOf(p);
          const sale = Number(p?.sale ?? 0);

          return (
            <div
              key={p.id}
              className="card mb-2 animate__animated animate__fadeInUp"
              style={{ boxShadow: 'var(--shadow)' }}
            >
              <div className="d-flex justify-content-between align-items-start" style={{ gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 800 }}>
                    #{p.id} — {zone || 'Sin zona'}
                  </div>
                  <div className="text-muted-2" style={{ fontSize: 12 }}>
                    {p?.description}
                  </div>
                </div>
                <div style={{ fontWeight: 800 }}>{money.format(sale)}</div>
              </div>

              {(lat != null || lng != null) && (
                <div className="text-muted-2" style={{ marginTop: 8, fontSize: 12 }}>
                  Lat: {lat != null ? lat.toFixed(5) : '—'} · Lng: {lng != null ? lng.toFixed(5) : '—'}
                </div>
              )}

              {hasActions && (
                <div className="d-flex justify-content-end" style={{ gap: 8, marginTop: 10 }}>
                  {showEdit && onEdit && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => onEdit(p)}
                      aria-label={`Editar punto ${p.id}`}
                    >
                      <EditIcon /> Editar
                    </button>
                  )}
                  {showDelete && onDelete && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => onDelete(p.id)}
                      aria-label={`Eliminar punto ${p.id}`}
                    >
                      <TrashIcon /> Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
