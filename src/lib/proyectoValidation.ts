import type { ProyectoInsert } from '../types/database.types';
export type ProyectoCampos = {
  nombre_cliente: string;
  direccion_instalacion: string;
  capacidad_kw: string;
  fecha_inicio: string;
  fecha_estimada_fin: string;
  notas_tecnicas: string;
};
export type ErroresProyecto = Partial<Record<keyof ProyectoCampos, string>>;
export const camposVacios: ProyectoCampos = {
  nombre_cliente: '',
  direccion_instalacion: '',
  capacidad_kw: '',
  fecha_inicio: '',
  fecha_estimada_fin: '',
  notas_tecnicas: '',
};
function fechaValida(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number(value.slice(0, 4)) >= 1 &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validarProyecto(values: ProyectoCampos): ErroresProyecto {
  const errors: ErroresProyecto = {};
  if (values.nombre_cliente.trim().length < 3)
    errors.nombre_cliente = 'Escribe al menos 3 caracteres.';
  if (values.direccion_instalacion.trim().length < 5)
    errors.direccion_instalacion = 'Escribe al menos 5 caracteres.';
  const capacidad = Number(values.capacidad_kw);
  if (
    !/^\d+(\.\d{1,2})?$/.test(values.capacidad_kw) ||
    !Number.isFinite(capacidad) ||
    capacidad <= 0 ||
    capacidad > 9999.99
  )
    errors.capacidad_kw =
      'Ingresa entre 0.01 y 9999.99 kW, con máximo 2 decimales.';
  if (!fechaValida(values.fecha_inicio))
    errors.fecha_inicio = 'Selecciona una fecha de inicio válida.';
  if (
    values.fecha_estimada_fin &&
    (!fechaValida(values.fecha_estimada_fin) ||
      values.fecha_estimada_fin < values.fecha_inicio)
  )
    errors.fecha_estimada_fin =
      'La fecha final debe ser válida e igual o posterior al inicio.';
  return errors;
}
export function datosProyecto(
  values: ProyectoCampos,
): Omit<ProyectoInsert, 'instalador_id'> {
  return {
    nombre_cliente: values.nombre_cliente.trim(),
    direccion_instalacion: values.direccion_instalacion.trim(),
    capacidad_kw: Number(values.capacidad_kw),
    fecha_inicio: values.fecha_inicio,
    fecha_estimada_fin: values.fecha_estimada_fin || null,
    notas_tecnicas: values.notas_tecnicas.trim() || null,
  };
}
