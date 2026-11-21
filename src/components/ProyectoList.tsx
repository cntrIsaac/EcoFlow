import { useState } from 'react';
import { FolderKanban, Search } from 'lucide-react';
import {
  ESTADOS,
  type EstadoProyecto,
  type Proyecto,
} from '../types/database.types';
import { mensajeError } from '../lib/supabase';
function ProyectoRow({
  proyecto: p,
  actualizarEstado,
}: {
  proyecto: Proyecto;
  actualizarEstado: (id: string, estado: EstadoProyecto) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function change(value: string) {
    const estado = ESTADOS.find((item) => item === value);
    if (!estado || saving) return;
    setSaving(true);
    setError('');
    try {
      await actualizarEstado(p.id, estado);
    } catch (cause) {
      setError(mensajeError(cause));
    } finally {
      setSaving(false);
    }
  }
  return (
    <tr className="border-t border-slate-100">
      <td className="px-5 py-4">
        <p className="font-semibold text-slate-800">{p.nombre_cliente}</p>
        <p className="mt-1 max-w-60 whitespace-normal text-xs text-slate-500">
          {p.direccion_instalacion}
        </p>
        {p.notas_tecnicas && (
          <p className="mt-1 max-w-60 whitespace-normal text-xs text-slate-500">
            {p.notas_tecnicas}
          </p>
        )}
      </td>
      <td className="px-4 py-4 font-medium">
        {p.capacidad_kw.toLocaleString('es-CO')}{' '}
        <span className="text-xs text-slate-400">kW</span>
      </td>
      <td className="px-4 py-4 text-xs text-slate-500">
        <time dateTime={p.fecha_inicio}>{p.fecha_inicio}</time>
        <p className="mt-1">Fin: {p.fecha_estimada_fin ?? 'Por definir'}</p>
      </td>
      <td className="px-5 py-4">
        <select
          aria-label={`Estado de ${p.nombre_cliente}`}
          disabled={saving}
          value={p.estado}
          onChange={(e) => {
            void change(e.target.value);
          }}
          className={`rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium ${p.estado === 'Completado' ? 'bg-emerald-50 text-emerald-800' : p.estado === 'En Progreso' ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'}`}
        >
          {ESTADOS.map((estado) => (
            <option key={estado}>{estado}</option>
          ))}
        </select>
        {saving && (
          <p role="status" className="mt-1 text-xs">
            Guardando…
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-2 max-w-48 whitespace-normal text-xs text-red-700"
          >
            {error}
          </p>
        )}
      </td>
    </tr>
  );
}
export function ProyectoList({
  proyectos,
  loading,
  actualizarEstado,
}: {
  proyectos: Proyecto[];
  loading: boolean;
  actualizarEstado: (id: string, estado: EstadoProyecto) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const visible = proyectos.filter((p) =>
    `${p.nombre_cliente} ${p.direccion_instalacion}`
      .toLocaleLowerCase('es')
      .includes(search.toLocaleLowerCase('es')),
  );
  return (
    <section className="panel overflow-hidden !p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-semibold text-slate-900">
            Proyectos de instalación{' '}
            <span className="ml-2 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500">
              {proyectos.length}
            </span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Seguimiento de tu operación solar
          </p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input
            aria-label="Buscar proyectos"
            className="input !pl-9"
            placeholder="Buscar cliente o dirección"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <p role="status" className="p-12 text-center text-sm text-slate-500">
          Cargando proyectos…
        </p>
      ) : visible.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Proyectos y estado de instalación
            </caption>
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                {['Cliente / ubicación', 'Capacidad', 'Fechas', 'Estado'].map(
                  (label) => (
                    <th
                      scope="col"
                      className="px-5 py-3 font-medium"
                      key={label}
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <ProyectoRow
                  key={p.id}
                  proyecto={p}
                  actualizarEstado={actualizarEstado}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5 py-16 text-center">
          <FolderKanban size={36} className="mx-auto mb-3 text-emerald-600" />
          <p className="font-medium text-slate-700">
            {search ? 'No hay coincidencias' : 'Todo comienza con un proyecto'}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {search
              ? 'Prueba con otro cliente o dirección.'
              : 'Crea una instalación para comenzar el seguimiento.'}
          </p>
        </div>
      )}
    </section>
  );
}
