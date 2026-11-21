import { useState, type FormEvent } from 'react';
import { Plus, LoaderCircle } from 'lucide-react';
import {
  camposVacios,
  datosProyecto,
  validarProyecto,
  type ErroresProyecto,
  type ProyectoCampos,
} from '../lib/proyectoValidation';
import { mensajeError } from '../lib/supabase';
import type { ProyectoInsert } from '../types/database.types';
type Props = {
  crearProyecto: (
    values: Omit<ProyectoInsert, 'instalador_id'>,
  ) => Promise<void>;
};
export function ProyectoForm({ crearProyecto }: Props) {
  const [values, setValues] = useState<ProyectoCampos>(camposVacios);
  const [errors, setErrors] = useState<ErroresProyecto>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const validation = validarProyecto(values);
    setErrors(validation);
    setMessage('');
    setFailure('');
    if (Object.keys(validation).length) return;
    setSaving(true);
    try {
      await crearProyecto(datosProyecto(values));
      setValues(camposVacios);
      setMessage('Proyecto creado correctamente.');
    } catch (cause) {
      setFailure(mensajeError(cause));
    } finally {
      setSaving(false);
    }
  }
  const fields: {
    name: keyof ProyectoCampos;
    label: string;
    type: string;
    placeholder?: string;
    required?: boolean;
  }[] = [
    {
      name: 'nombre_cliente',
      label: 'Nombre del cliente',
      type: 'text',
      placeholder: 'Ej. Residencial Los Olivos',
      required: true,
    },
    {
      name: 'direccion_instalacion',
      label: 'Dirección de instalación',
      type: 'text',
      placeholder: 'Calle, número y ciudad',
      required: true,
    },
    {
      name: 'capacidad_kw',
      label: 'Capacidad (kW)',
      type: 'number',
      placeholder: '5.50',
      required: true,
    },
    {
      name: 'fecha_inicio',
      label: 'Fecha de inicio',
      type: 'date',
      required: true,
    },
    {
      name: 'fecha_estimada_fin',
      label: 'Fin estimado · opcional',
      type: 'date',
    },
  ];
  return (
    <section className="panel h-fit">
      <div className="mb-6 flex items-center gap-3">
        <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
          <Plus size={20} />
        </span>
        <div>
          <h2 className="font-semibold text-slate-900">Nuevo proyecto</h2>
          <p className="text-xs text-slate-500">
            Planifica tu próxima instalación
          </p>
        </div>
      </div>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        noValidate
      >
        <fieldset disabled={saving} className="space-y-4">
          {fields.map(({ name, label, type, placeholder, required }) => (
            <div key={name}>
              <label htmlFor={name} className="label">
                {label}
              </label>
              <input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                required={required}
                value={values[name]}
                onChange={(e) =>
                  setValues({ ...values, [name]: e.target.value })
                }
                className="input"
                aria-invalid={Boolean(errors[name])}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
                step={type === 'number' ? '0.01' : undefined}
                min={
                  type === 'number'
                    ? '0.01'
                    : name === 'fecha_estimada_fin'
                      ? values.fecha_inicio
                      : undefined
                }
                max={type === 'number' ? '9999.99' : undefined}
              />
              {errors[name] && (
                <p id={`${name}-error`} className="mt-1 text-xs text-red-700">
                  {errors[name]}
                </p>
              )}
            </div>
          ))}
          <div>
            <label htmlFor="notas_tecnicas" className="label">
              Notas técnicas · opcional
            </label>
            <textarea
              id="notas_tecnicas"
              className="input min-h-24 resize-y"
              placeholder="Detalles de cubierta, acceso, equipos…"
              value={values.notas_tecnicas}
              onChange={(e) =>
                setValues({ ...values, notas_tecnicas: e.target.value })
              }
            />
          </div>
          <button type="submit" className="button w-full justify-center">
            {saving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Plus size={17} />
            )}
            {saving ? 'Guardando…' : 'Crear proyecto'}
          </button>
        </fieldset>
        {failure && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {failure}
          </p>
        )}
        {message && (
          <p role="status" className="mt-3 text-sm text-emerald-700">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}
