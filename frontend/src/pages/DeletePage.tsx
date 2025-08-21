import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { deletePoint, listPoints, Point } from '../api/points';
import PointsTable from '../components/PointsTable';

/* ===================== Utilidades UI ===================== */
const IconWarning = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v7a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0A.5.5 0 0 1 8.5 6v7a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v7a.5.5 0 0 0 1 0V6z"/>
    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 1 1 0-2H5V1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1h2.5a1 1 0 0 1 1 1zM6 1v1h4V1H6zm7 3H3v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4z"/>
  </svg>
);

const IconSpinner = () => (
  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
);

/* ===================== Aviso flotante ===================== */
type Notice = { type: 'success' | 'error' | 'warning'; message: string };

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
      setTimeout(onClose, 350);
    }, ms);
    return () => clearTimeout(t);
  }, [ms, onClose]);

  const base =
    'position-fixed top-0 start-50 translate-middle-x mt-3 shadow-lg rounded-3 animate__animated ' +
    (closing ? 'animate__fadeOutUp' : 'animate__fadeInDown');

  const tone =
    notice.type === 'success'
      ? 'bg-success text-white border border-success-subtle'
      : notice.type === 'error'
      ? 'bg-danger text-white border border-danger-subtle'
      : 'bg-warning text-dark border border-warning';

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`${base} ${tone}`}
      style={{ zIndex: 2100, minWidth: 420, maxWidth: '92vw', cursor: 'pointer' }}
      onClick={() => {
        setClosing(true);
        setTimeout(onClose, 250);
      }}
    >
      <div className="d-flex align-items-center gap-3 px-3 py-2">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle"
          style={{ width: 28, height: 28, background: 'rgba(0,0,0,.08)' }}
        >
          <IconWarning />
        </div>
        <strong className="me-2">{notice.message}</strong>
      </div>
    </div>,
    document.body
  );
}

/* ===================== Overlay ocupado ===================== */
function BusyOverlay({ text = 'Eliminando…' }: { text?: string }) {
  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        background: 'rgba(255,255,255,.65)',
        backdropFilter: 'blur(2px)',
        zIndex: 2000,
      }}
    >
      <div className="bg-white border rounded-4 px-4 py-3 d-flex align-items-center gap-3 shadow-lg animate__animated animate__fadeIn">
        <IconSpinner />
        <strong className="fs-6">{text}</strong>
      </div>
    </div>,
    document.body
  );
}

/* ===================== Confirmación accesible ===================== */
function ConfirmOverlay({
  title = 'Eliminar punto de venta',
  question = '¿Estás seguro de eliminar este punto de venta?',
  detail = 'Esta acción no se puede deshacer.',
  onYes,
  onNo,
}: {
  title?: string;
  question?: string;
  detail?: string;
  onYes: () => void;
  onNo: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    cancelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onNo(); }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          (last as HTMLElement).focus(); e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          (first as HTMLElement).focus(); e.preventDefault();
        }
      }
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === yesRef.current) {
        e.preventDefault(); onYes();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onNo, onYes]);

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onNo();
  };

  const headerIcon = (
    <div
      className="d-inline-flex align-items-center justify-content-center rounded-circle"
      style={{ width: 44, height: 44, background: '#ffe5e7', color: '#dc3545', border: '1px solid rgba(220,53,69,.15)' }}
    >
      <IconWarning />
    </div>
  );

  return createPortal(
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(255,255,255,.65)', backdropFilter: 'blur(2px)', zIndex: 2050 }}
      onMouseDown={onBackdrop}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="bg-white border rounded-4 shadow-lg animate__animated animate__fadeInDown"
        style={{ maxWidth: 560, width: '92vw' }}
      >
        <div className="px-4 pt-4 pb-3 border-bottom d-flex align-items-center gap-3">
          {headerIcon}
          <div className="d-flex flex-column">
            <strong id="confirm-title" className="fs-5">{title}</strong>
            <small className="text-muted">Acción irreversible</small>
          </div>
        </div>

        <div className="px-4 py-3">
          <p className="mb-1">{question}</p>
          <small className="text-muted">{detail}</small>
        </div>

        <div className="px-4 py-3 border-top d-flex justify-content-end gap-2">
          <button ref={cancelRef} className="btn btn-outline-secondary px-3" onClick={onNo}>
            No
          </button>
          <button ref={yesRef} className="btn btn-danger px-3" onClick={onYes} style={{ borderRadius: 12 }}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ===================== Callout informativo (como tu ejemplo) ===================== */
function DeleteHint() {
  return (
    <div className="animate__animated animate__fadeIn">
      <div
        className="border rounded-3 p-3 d-flex align-items-start gap-3"
        style={{
          background: 'linear-gradient(0deg, rgba(220,38,38,.06), rgba(220,38,38,.06)), #fff',
          borderColor: 'var(--line)',
        }}
      >
        <span
          className="d-inline-flex align-items-center justify-content-center rounded-circle"
          style={{
            width: 36,
            height: 36,
            background: 'radial-gradient(closest-side, rgba(220,38,38,.18), rgba(220,38,38,.12))',
            color: '#dc2626',
          }}
        >
          <IconTrash />
        </span>
        <div className="small">
          <div className="fw-bold mb-1">Eliminación deshabilitada</div>
          <div className="text-muted">
            Para eliminar, usa el botón <strong>Eliminar</strong> en el listado. Te pediremos confirmación
            y la acción no se puede deshacer.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== Página ===================== */
export default function DeletePage() {
  const [data, setData] = useState<Point[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => setData(await listPoints(1, 200));
  useEffect(() => { load(); }, []);

  // Abrir confirmación (sin borrar aún)
  const onDeleteRequest = (id: number) => { setConfirmId(id); };

  // Confirmación: Sí => eliminar
  const confirmYes = async () => {
    if (confirmId == null) return;
    try {
      setBusy(true);
      await deletePoint(confirmId);
      await load();
      setNotice({ type: 'warning', message: 'Punto de venta eliminado' });
    } catch {
      setNotice({ type: 'error', message: 'Error al eliminar, intenta de nuevo o contacta a soporte' });
    } finally {
      setBusy(false);
      setConfirmId(null);
    }
  };

  const confirmNo = () => setConfirmId(null);

  const selected = confirmId != null ? data.find(d => (d as any).id === confirmId) : undefined;

  return (
    <div className="grid">
      <div className="card animate__animated animate__fadeInUp">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h2 className="page-title mb-1">Puntos de Venta</h2>
          </div>
        </div>

        <div className="mt-3">
          <DeleteHint />
        </div>
      </div>

      <PointsTable data={data} showEdit={false} onDelete={onDeleteRequest} />

      {confirmId !== null && (
        <ConfirmOverlay
          title="Eliminar punto de venta"
          question={
            selected
              ? `¿Seguro que deseas eliminar el punto de venta con ID #${(selected as any).id}?`
              : '¿Estás seguro de eliminar este punto de venta?'
          }
          detail="Esta acción no se puede deshacer."
          onYes={confirmYes}
          onNo={confirmNo}
        />
      )}

      {busy && <BusyOverlay text="Eliminando…" />}
      {notice && <FloatingNotice notice={notice} onClose={() => setNotice(null)} />}
    </div>
  );
}
