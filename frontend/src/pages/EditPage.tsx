import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { listPoints, updatePoint, Point } from '../api/points';
import PointsTable from '../components/PointsTable';
import FormPoint from '../components/FormPoint';

/* ========= Aviso flotante (éxito / error) ========= */
type Notice = { type: 'success' | 'error'; message: string };

function FloatingNotice({
  notice,
  onClose,
  ms = 3500,
}: {
  notice: Notice;
  onClose: () => void;
  ms?: number;
}) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setClosing(true);
      setTimeout(onClose, 400);
    }, ms);
    return () => clearTimeout(t);
  }, [ms, onClose]);

  const cls =
    'position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg border rounded-3 px-3 py-2 animate__animated ' +
    (closing ? 'animate__fadeOutUp' : 'animate__fadeInDown') +
    (notice.type === 'success' ? ' bg-success text-white' : ' bg-danger text-white');

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cls}
      style={{ zIndex: 4100, minWidth: 360, maxWidth: '90vw', cursor: 'pointer' }}
      onClick={() => {
        setClosing(true);
        setTimeout(onClose, 300);
      }}
    >
      {notice.message}
    </div>,
    document.body
  );
}

/* ========= Overlay “Guardando…” ========= */
function BusyOverlay({ text = 'Guardando cambios…' }: { text?: string }) {
  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        background: 'rgba(255,255,255,.65)',
        backdropFilter: 'blur(2px)',
        zIndex: 4050,
        pointerEvents: 'auto',
      }}
    >
      <div className="bg-white border rounded-3 px-4 py-3 d-flex align-items-center gap-3 shadow-lg animate__animated animate__fadeIn">
        <span className="spinner-border" role="status" aria-hidden="true" />
        <strong className="fs-6">{text}</strong>
      </div>
    </div>,
    document.body
  );
}

/* ========= Helpers de normalización ========= */
const resolveZone = (p: any) =>
  p?.zoneName ?? p?.zone?.name ?? p?.zone ?? p?.Zone ?? '';

const normalizeRows = (rows: any[]): Point[] =>
  rows.map((r) => ({
    ...r,
    zone: resolveZone(r),
    sale: Number(r?.sale ?? 0),
  })) as Point[];

/* ========= Modal de confirmación ========= */
function ConfirmEditModal({
  point,
  onYes,
  onNo,
}: {
  point: Point;
  onYes: () => void;
  onNo: () => void;
}) {
  const Pencil = (
    <svg width="18" height="18" viewBox="0 0 16 16" className="text-primary">
      <path
        fill="currentColor"
        d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L5.207 14.5H2v-3.207L12.146.146zM11.207 2 3 10.207V13h2.793L14 4.793 11.207 2z"
      />
    </svg>
  );
  const Alert = (
    <svg width="18" height="18" viewBox="0 0 16 16" className="text-danger">
      <path
        fill="currentColor"
        d="M7.938 2.016a1 1 0 0 1 1.124 0l6.857 4.57A1 1 0 0 1 16.5 7.43v6.143a1 1 0 0 1-.581.914l-6.857 3.43a1 1 0 0 1-.924 0l-6.857-3.43A1 1 0 0 1 .5 13.571V7.43a1 1 0 0 1 .581-.914l6.857-4.57zM8 4.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5A.75.75 0 0 0 8 4.5zm0 7.75a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
      />
    </svg>
  );

  const zoneText = resolveZone(point);

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        background: 'rgba(17,24,39,.55)',
        backdropFilter: 'blur(4px) brightness(.95)',
        zIndex: 4010,
      }}
    >
      <div
        className="bg-white border rounded-3 shadow-lg animate__animated animate__fadeInUp"
        style={{ maxWidth: 640, width: '92vw' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-4 py-3 border-bottom d-flex align-items-center gap-2">
          <span className="badge text-bg-primary d-inline-flex align-items-center gap-2">
            {Pencil} Confirmar
          </span>
          <strong>Editar punto de venta</strong>
        </div>

        <div className="px-4 py-3">
          <p className="mb-2 d-flex align-items-center gap-2">
            {Alert} <strong>Importante:</strong> al continuar, la información actual será reemplazada.
          </p>
          <div className="row g-2 small">
            <div className="col-12 col-md-6">
              <div className="p-2 rounded border bg-light">
                ID: <strong>{(point as any).id}</strong>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="p-2 rounded border bg-light">
                Zona: <strong>{zoneText}</strong>
              </div>
            </div>
            <div className="col-12">
              <div className="p-2 rounded border bg-light">
                Descripción: <strong>{(point as any).description}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button className="btn btn-outline-light" onClick={onNo}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={onYes}>
            Sí, editar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ========= Modal de EDICIÓN ========= */
function EditOverlay({
  point,
  formKey,
  onSubmit,
  onCancel,
}: {
  point: Point;
  formKey: number;
  onSubmit: (p: Point) => void;
  onCancel: () => void;
}) {
  const zoneText = resolveZone(point);

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-start justify-content-center pt-4 pt-md-5"
      style={{
        background: 'rgba(17,24,39,.55)',
        backdropFilter: 'blur(4px) brightness(.95)',
        zIndex: 4030,
        overflowY: 'auto',
      }}
    >
      <div
        className="bg-white border rounded-3 shadow-lg animate__animated animate__fadeInUp"
        style={{ width: 'min(960px, 96vw)' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-4 py-3 border-bottom">
          <h2 className="page-title mb-1">Modificación / Edición</h2>
          <p className="subtitle text-muted-2 m-0">Editando el registro seleccionado.</p>

          <div className="mt-3 d-flex flex-wrap gap-2 small">
            <span className="tb-chip">
              <span className="tb-ico">#</span>ID <strong>{(point as any).id}</strong>
            </span>
            <span className="tb-chip">
              Zona <strong>{zoneText}</strong>
            </span>
            <span className="tb-chip">
              Venta <strong>${Number((point as any).sale ?? 0).toFixed(2)}</strong>
            </span>
          </div>
        </div>

        <div className="px-4 py-3">
          <FormPoint key={formKey} initial={point} onSubmit={onSubmit} onCancel={onCancel} />
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ========= Callout “Edición deshabilitada” ========= */
function DisabledHint() {
  return (
    <div className="mt-2 animate__animated animate__fadeIn">
      <div
        className="border rounded-3 p-3 d-flex align-items-start gap-3"
        style={{
          background: 'linear-gradient(0deg, rgba(59,130,246,.06), rgba(59,130,246,.06)), #fff',
          borderColor: 'var(--line)',
        }}
      >
        <span
          className="d-inline-flex align-items-center justify-content-center rounded-circle"
          style={{
            width: 36,
            height: 36,
            background: 'radial-gradient(closest-side, rgba(59,130,246,.18), rgba(59,130,246,.12))',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" className="text-primary">
            <path
              fill="currentColor"
              d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L5.207 14.5H2v-3.207L12.146.146zM11.207 2 3 10.207V13h2.793L14 4.793 11.207 2z"
            />
          </svg>
        </span>
        <div className="small">
          <div className="fw-bold mb-1">Edición deshabilitada</div>
          <div className="text-muted">
            Para editar, elige un registro en el listado y confirma la edición. El formulario aparecerá arriba del listado.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========= Página ========= */
export default function EditPage() {
  const [data, setData] = useState<Point[]>([]);
  const [editing, setEditing] = useState<Point | null>(null);
  const [pending, setPending] = useState<Point | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [formKey, setFormKey] = useState(0);

  const load = async () => {
    const rows = await listPoints(1, 200);
    setData(normalizeRows(rows as any));
  };
  useEffect(() => {
    load();
  }, []);

  const onEditRequest = (p: Point) => setPending(p);
  const acceptEdit = () => {
    if (pending) {
      setEditing(pending);
      setPending(null);
    }
  };
  const cancelEdit = () => {
    setPending(null);
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  const onSubmit = async (p: Point) => {
    if (!editing?.id) return;

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const MIN_SPINNER_MS = 320;

    setBusy(true);
    const hold = delay(MIN_SPINNER_MS);

    try {
      await updatePoint(editing.id, p);
      setNotice({ type: 'success', message: 'Cambios guardados correctamente' });
      setEditing(null);
      setFormKey((k) => k + 1);
      await load();
    } catch {
      setNotice({ type: 'error', message: 'No se pudo guardar. Intenta de nuevo.' });
    } finally {
      await hold;
      setBusy(false);
    }
  };

  return (
    <>
      {/* === Card 1: Encabezado + Callout === */}
      <div className="grid">
        <div className="card animate__animated animate__fadeInUp">
          <h2 className="page-title mb-1">Modificación / Edición</h2>
          <DisabledHint />
        </div>

        {/* === Card 2: SOLO la tabla (sin título extra en la página) === */}
        <div className="points-wrap animate__animated animate__fadeInUp">
          <PointsTable data={data} onEdit={onEditRequest} showDelete={false} />
        </div>
      </div>

      {/* Modales */}
      {pending && <ConfirmEditModal point={pending} onYes={acceptEdit} onNo={cancelEdit} />}
      {editing && (
        <EditOverlay point={editing} formKey={formKey} onSubmit={onSubmit} onCancel={cancelEdit} />
      )}

      {/* Overlays / avisos */}
      {busy && <BusyOverlay text="Guardando cambios…" />}
      {notice && <FloatingNotice notice={notice} onClose={() => setNotice(null)} />}
    </>
  );
}
