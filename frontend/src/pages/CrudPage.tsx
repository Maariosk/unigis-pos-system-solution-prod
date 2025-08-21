import { useEffect, useState } from 'react';
import { Point, listPoints, createPoint, updatePoint, deletePoint } from '../api/points';
import FormPoint from '../components/FormPoint';
import PointsTable from '../components/PointsTable';

export default function CrudPage(){
  const [data, setData] = useState<Point[]>([]);
  const [editing, setEditing] = useState<Point|null>(null);

  const load = async ()=> setData(await listPoints(1, 100));
  useEffect(()=>{ load(); }, []);

  const onSubmit = async (p: Point)=>{
    if(editing?.id) { await updatePoint(editing.id, p); setEditing(null); }
    else { await createPoint(p); }
    await load();
  };

  const onDelete = async (id:number)=>{
    if(!window.confirm('¿Eliminar el registro?')) return;
    await deletePoint(id);
    await load();
  };

  return (
    <div className="grid grid-2">
      <div className="card">
        <h2 className="page-title">{editing ? 'Editar Punto' : 'Nuevo Punto'}</h2>
        <p className="subtitle">Registro, Baja, Modificación de Puntos de Venta.</p>
        <FormPoint initial={editing} onSubmit={onSubmit} onCancel={()=>setEditing(null)} />
      </div>
      <PointsTable data={data} onEdit={setEditing} onDelete={onDelete}/>
    </div>
  );
}
