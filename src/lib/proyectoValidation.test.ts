import { describe, expect, it } from 'vitest';
import {
  camposVacios,
  datosProyecto,
  validarProyecto,
  type ProyectoCampos,
} from './proyectoValidation';
const valid: ProyectoCampos = {
  nombre_cliente: 'Cliente solar',
  direccion_instalacion: 'Calle 10 # 20',
  capacidad_kw: '5.50',
  fecha_inicio: '2026-11-20',
  fecha_estimada_fin: '',
  notas_tecnicas: '',
};
describe('contrato de creación de proyectos', () => {
  it('rechaza campos requeridos vacíos', () => {
    expect(Object.keys(validarProyecto(camposVacios))).toHaveLength(4);
  });
  it('valida longitudes después de quitar espacios', () => {
    expect(
      validarProyecto({
        ...valid,
        nombre_cliente: ' a ',
        direccion_instalacion: ' abc ',
      }),
    ).toMatchObject({
      nombre_cliente: expect.any(String),
      direccion_instalacion: expect.any(String),
    });
  });
  it.each(['0', '-1', 'NaN', 'Infinity', '10000', '1.001', '0.001'])(
    'rechaza capacidad inválida %s',
    (capacidad_kw) => {
      expect(
        validarProyecto({ ...valid, capacidad_kw }).capacidad_kw,
      ).toBeDefined();
    },
  );
  it.each(['0.01', '9999.99', '5'])(
    'acepta capacidad representable %s',
    (capacidad_kw) => {
      expect(validarProyecto({ ...valid, capacidad_kw })).toEqual({});
    },
  );
  it('rechaza fechas imposibles y rangos invertidos', () => {
    expect(
      validarProyecto({ ...valid, fecha_inicio: '2026-02-30' }).fecha_inicio,
    ).toBeDefined();
    expect(
      validarProyecto({ ...valid, fecha_estimada_fin: '2026-11-19' })
        .fecha_estimada_fin,
    ).toBeDefined();
  });
  it('acepta finalizar el mismo día y final opcional', () => {
    expect(validarProyecto(valid)).toEqual({});
    expect(
      validarProyecto({ ...valid, fecha_estimada_fin: valid.fecha_inicio }),
    ).toEqual({});
  });
  it('normaliza texto, decimales y nulos para PostgreSQL', () => {
    expect(
      datosProyecto({ ...valid, nombre_cliente: ' Cliente solar ' }),
    ).toMatchObject({
      nombre_cliente: 'Cliente solar',
      capacidad_kw: 5.5,
      fecha_estimada_fin: null,
      notas_tecnicas: null,
    });
  });
});
