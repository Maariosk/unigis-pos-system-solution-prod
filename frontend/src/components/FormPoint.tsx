import { useEffect, useMemo, useState } from 'react';
import { Point } from '../api/points';

type Props = {
  initial?: Point | null;
  onSubmit: (p: Point) => void;
  onCancel?: () => void;
  bindSetCoords?: (fn: (lat: number, lng: number) => void) => void;
};

type Errors = Partial<Record<'latitude'|'longitude'|'description'|'sale'|'zone'|'general', string>>;

export default function FormPoint({ initial, onSubmit, onCancel, bindSetCoords }: Props){
  const [form, setForm] = useState<Point>({
    latitude: 0, longitude: 0, description: '', sale: 0, zone: ''
  });


  const [saleInput, setSaleInput] = useState<string>('0');
  const [errors, setErrors] = useState<Errors>({});
  const [triedSubmit, setTriedSubmit] = useState(false);

  // Cargar valores iniciales si llegan
  useEffect(() => {
    if (!initial) return;
    setForm(initial);
    setSaleInput(String(initial.sale ?? 0));
  }, [initial]);

  // Exponer setter de coordenadas al padre (CreatePage)
  useEffect(() => {
    bindSetCoords?.((la: number, lo: number) => {
      setForm(f => ({ ...f, latitude: la, longitude: lo }));
    });
  }, [bindSetCoords]);

  // --- Handlers ---
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'sale') {
      // Solo números y un punto decimal
      let clean = value.replace(/[^\d.]/g, '');
      clean = clean.replace(/(\..*)\./g, '$1'); // un solo punto
      setSaleInput(clean);

      const num = clean === '' ? 0 : Number(clean);
      setForm(f => ({ ...f, sale: Number.isFinite(num) ? num : 0 }));
      if (triedSubmit) validate({ ...form, sale: Number.isFinite(num) ? num : 0 });
      return;
    }

    if (name === 'latitude' || name === 'longitude') {
      const num = value === '' ? 0 : Number(value);
      setForm(f => ({ ...f, [name]: Number.isFinite(num) ? num : 0 } as Point));
      if (triedSubmit) validate({ ...form, [name]: Number.isFinite(num) ? num : 0 } as Point);
      return;
    }

    setForm(f => ({ ...f, [name]: value } as Point));
    if (triedSubmit) validate({ ...form, [name]: value } as Point);
  };

  // --- Validación ---
  const validate = (state: Point = form) => {
    const e: Errors = {};
    if (!state.description.trim()) e.description = 'Requerido';
    if (!state.zone.trim()) e.zone = 'Requerido';
    if (!Number.isFinite(state.latitude) || state.latitude === 0) e.latitude = 'Ingresa una latitud válida';
    if (!Number.isFinite(state.longitude) || state.longitude === 0) e.longitude = 'Ingresa una longitud válida';
    if (!(state.sale > 0)) e.sale = 'Ingresa un monto mayor a 0';

    if (
      (!state.description.trim() && !state.zone.trim()) ||
      (state.latitude === 0 && state.longitude === 0 && state.sale === 0)
    ) {
      e.general = 'Favor de completar la información';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canSubmit = useMemo(() => {
    return (
      form.description.trim() !== '' &&
      form.zone.trim() !== '' &&
      Number.isFinite(form.latitude) && form.latitude !== 0 &&
      Number.isFinite(form.longitude) && form.longitude !== 0 &&
      form.sale > 0
    );
  }, [form]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTriedSubmit(true);
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <div
      className="elevated-form animate__animated animate__fadeInUp"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
        padding: 16
      }}
    >
      {errors.general && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {errors.general}
        </div>
      )}

      <form className="form" onSubmit={submit} noValidate>
        <div className="row cols-2">
          <div>
            <label className="form-label">Latitud</label>
            <input
              className={`form-control ${errors.latitude ? 'is-invalid' : ''}`}
              name="latitude"
              type="number"
              inputMode="decimal"
              step="0.000001"
              placeholder="19.432608"
              value={form.latitude}
              onChange={onChange}
              required
            />
            {errors.latitude && <div className="invalid-feedback">{errors.latitude}</div>}
          </div>
          <div>
            <label className="form-label">Longitud</label>
            <input
              className={`form-control ${errors.longitude ? 'is-invalid' : ''}`}
              name="longitude"
              type="number"
              inputMode="decimal"
              step="0.000001"
              placeholder="-99.133209"
              value={form.longitude}
              onChange={onChange}
              required
            />
            {errors.longitude && <div className="invalid-feedback">{errors.longitude}</div>}
          </div>
        </div>

        <div>
          <label className="form-label">Descripción</label>
          <input
            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
            name="description"
            placeholder="Sucursal Roma Norte"
            value={form.description}
            onChange={onChange}
            required
          />
          {errors.description && <div className="invalid-feedback">{errors.description}</div>}
        </div>

        <div className="row cols-2">
          <div>
            <label className="form-label">Venta</label>
            <input
              className={`form-control ${errors.sale ? 'is-invalid' : ''}`}
              name="sale"
              type="text"                 /* sin flechas */
              inputMode="decimal"         /* teclado numérico en móviles */
              pattern="^\d*\.?\d*$"       /* solo números y un punto */
              placeholder="12000.00"
              value={saleInput}
              onChange={onChange}
              required
            />
            {errors.sale && <div className="invalid-feedback">{errors.sale}</div>}
          </div>
          <div>
            <label className="form-label">Zona</label>
            <input
              className={`form-control ${errors.zone ? 'is-invalid' : ''}`}
              name="zone"
              placeholder="Zona Centro"
              value={form.zone}
              onChange={onChange}
              required
            />
            {errors.zone && <div className="invalid-feedback">{errors.zone}</div>}
          </div>
        </div>

        <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
          <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
            {initial && (initial as any).id ? 'Actualizar' : 'Guardar'}
          </button>
          {onCancel && (
            <button className="btn btn-ghost" type="button" onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
