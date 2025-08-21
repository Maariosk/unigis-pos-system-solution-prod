import http from './http';

export type Point = {
  id?: number;
  latitude: number;
  longitude: number;
  description: string;
  sale: number;
  zone: string;
  createdAt?: string;
  updatedAt?: string | null;
};

export type SalesByZone = { zone: string; totalSale: number };

/* ----------------------- helpers ----------------------- */
const round = (v: any, d: number) => Number(Number(v).toFixed(d));

/** Normaliza el payload para guardado/actualización */
const normalizeForSave = (p: Point) => ({
  latitude: round(p.latitude, 6),
  longitude: round(p.longitude, 6),
  description: (p.description ?? '').trim(),
  sale: round(p.sale, 2),
  zone: (p.zone ?? '').trim(),
});

/** Saca mensaje legible del error HTTP (ASP.NET/ProblemDetails/ModelState/etc.) */
const extractError = (err: any): string => {
  const data = err?.response?.data;

  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title; // ProblemDetails

  // ModelState: { errors: { Field: ["msg1","msg2"] } }
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values<any>(data.errors)[0];
    if (Array.isArray(first) && first.length) return first[0];
  }

  return err?.message || 'Error desconocido en el servidor';
};

/* ----------------------- API calls ----------------------- */

export const listPoints = async (page = 1, size = 50) => {
  try {
    const { data } = await http.get<Point[]>(`/points?page=${page}&size=${size}`);
    return data;
  } catch (err: any) {
    throw new Error(extractError(err));
  }
};

export const getPoint = async (id: number) => {
  try {
    const { data } = await http.get<Point>(`/points/${id}`);
    return data;
  } catch (err: any) {
    throw new Error(extractError(err));
  }
};

export const createPoint = async (p: Point) => {
  try {
    const payload = normalizeForSave(p);
    const { data } = await http.post<Point>('/points', payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return data;
  } catch (err: any) {
    throw new Error(extractError(err));
  }
};

export const updatePoint = async (id: number, p: Point) => {
  try {
    const payload = normalizeForSave(p);
    const { data } = await http.put<void>(`/points/${id}`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return data;
  } catch (err: any) {
    throw new Error(extractError(err));
  }
};

export const deletePoint = async (id: number) => {
  try {
    const { data } = await http.delete<void>(`/points/${id}`);
    return data;
  } catch (err: any) {
    throw new Error(extractError(err));
  }
};

export const salesByZone = async () => {
  try {
    const { data } = await http.get<SalesByZone[]>('/points/sales-by-zone');
    return data;
  } catch (err: any) {
    throw new Error(extractError(err));
  }
};
