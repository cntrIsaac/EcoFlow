import { CircleDashed, HardHat, CircleCheck, Zap } from 'lucide-react';
import type { Proyecto } from '../types/database.types';
export function DashboardStats({ proyectos }: { proyectos: Proyecto[] }) {
  const items = [
    {
      label: 'Pendiente',
      value: proyectos.filter((p) => p.estado === 'Pendiente').length,
      icon: CircleDashed,
      color: 'bg-amber-50 text-amber-700',
      detail: 'Por iniciar',
    },
    {
      label: 'En Progreso',
      value: proyectos.filter((p) => p.estado === 'En Progreso').length,
      icon: HardHat,
      color: 'bg-blue-50 text-blue-700',
      detail: 'Instalaciones activas',
    },
    {
      label: 'Completado',
      value: proyectos.filter((p) => p.estado === 'Completado').length,
      icon: CircleCheck,
      color: 'bg-emerald-50 text-emerald-700',
      detail: 'Proyectos finalizados',
    },
    {
      label: 'Capacidad total',
      value: new Intl.NumberFormat('es-CO', {
        maximumFractionDigits: 2,
      }).format(proyectos.reduce((sum, p) => sum + p.capacidad_kw, 0)),
      icon: Zap,
      color: 'bg-violet-50 text-violet-700',
      detail: 'kW de todos los proyectos',
    },
  ];
  const instalada = proyectos
    .filter((p) => p.estado === 'Completado')
    .reduce((sum, p) => sum + p.capacidad_kw, 0);
  return (
    <section aria-label="Indicadores de proyectos">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(({ label, value, icon: Icon, color, detail }) => (
          <article className="panel" key={label}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <span className={`rounded-xl p-2 ${color}`}>
                <Icon size={19} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              {value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-right text-xs text-slate-500">
        Capacidad instalada (completados):{' '}
        {instalada.toLocaleString('es-CO', { maximumFractionDigits: 2 })} kW
      </p>
    </section>
  );
}
