import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const db = new PGlite();
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const admin = '33333333-3333-4333-8333-333333333333';
const inactive = '44444444-4444-4444-8444-444444444444';
const projectA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const projectB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

async function asUser(id, operation) {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec('set role authenticated');
  try {
    return await operation();
  } finally {
    await db.exec('reset role');
  }
}

beforeAll(async () => {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
    create publication supabase_realtime;
  `);
  await db.exec(
    await readFile(new URL('./schema.sql', import.meta.url), 'utf8'),
  );
  for (const [id, name, rol, activo] of [
    [alice, 'Alice Solar', 'instalador', true],
    [bob, 'Bob Solar', 'instalador', true],
    [admin, 'Admin Solar', 'admin', true],
    [inactive, 'Inactivo Solar', 'instalador', false],
  ]) {
    await db.query('insert into auth.users (id) values ($1)', [id]);
    await db.query(
      'insert into public.instaladores (id, nombre_completo, email, rol, activo) values ($1,$2,$3,$4,$5)',
      [id, name, `${id}@example.com`, rol, activo],
    );
  }
  for (const [id, owner] of [
    [projectA, alice],
    [projectB, bob],
  ]) {
    await db.query(
      "insert into public.proyectos (id, nombre_cliente, direccion_instalacion, capacidad_kw, fecha_inicio, instalador_id) values ($1,'Cliente solar','Calle 123',5.50,'2026-11-20',$2)",
      [id, owner],
    );
  }
  await db.exec(
    `insert into public.proyecto_materiales (proyecto_id, material_id, cantidad_asignada) select '${projectA}', id, 1 from public.materiales limit 1`,
  );
}, 30000);
afterAll(async () => {
  await db.close();
});

describe('contrato PostgreSQL y RLS con identidades simuladas', () => {
  it('instalador ve solo su proyecto y perfil sin recursión 42P17', async () => {
    await asUser(alice, async () => {
      expect((await db.query('select id from public.proyectos')).rows).toEqual([
        { id: projectA },
      ]);
      expect(
        (await db.query('select id from public.instaladores')).rows,
      ).toEqual([{ id: alice }]);
      expect(
        (await db.query('select public.es_admin() as admin')).rows,
      ).toEqual([{ admin: false }]);
    });
  });
  it('administrador activo accede a todos los proyectos', async () => {
    await asUser(admin, async () => {
      expect(
        (await db.query('select id from public.proyectos')).rows,
      ).toHaveLength(2);
    });
  });
  it('un perfil inactivo no accede a proyectos ni materiales', async () => {
    await asUser(inactive, async () => {
      expect(
        (await db.query('select * from public.proyectos')).rows,
      ).toHaveLength(0);
      expect(
        (await db.query('select * from public.materiales')).rows,
      ).toHaveLength(0);
    });
  });
  it('permite crear un proyecto propio', async () => {
    await asUser(alice, async () => {
      const result = await db.query(
        "insert into public.proyectos (nombre_cliente, direccion_instalacion, capacidad_kw, fecha_inicio, instalador_id) values ('Nuevo cliente','Calle 456',1.25,'2026-11-20',$1) returning estado",
        [alice],
      );
      expect(result.rows).toEqual([{ estado: 'Pendiente' }]);
    });
  });
  it('impide crear proyectos para otro instalador', async () => {
    await asUser(alice, async () => {
      await expect(
        db.query(
          "insert into public.proyectos (nombre_cliente, direccion_instalacion, capacidad_kw, fecha_inicio, instalador_id) values ('Cliente ajeno','Calle 456',5,'2026-11-20',$1)",
          [bob],
        ),
      ).rejects.toThrow(/row-level security/i);
    });
  });
  it('impide reasignar un proyecto y modificar proyectos ajenos', async () => {
    await asUser(alice, async () => {
      await expect(
        db.query(
          'update public.proyectos set instalador_id = $1 where id = $2',
          [bob, projectA],
        ),
      ).rejects.toThrow(/row-level security/i);
      expect(
        (
          await db.query(
            "update public.proyectos set estado = 'Completado' where id = $1 returning id",
            [projectB],
          )
        ).rows,
      ).toHaveLength(0);
    });
  });
  it('impide elevar el rol o escribir el inventario desde un instalador', async () => {
    await asUser(alice, async () => {
      expect(
        (
          await db.query(
            "update public.instaladores set rol = 'admin' where id = $1 returning id",
            [alice],
          )
        ).rows,
      ).toHaveLength(0);
      await expect(
        db.query(
          "insert into public.materiales (sku,nombre,categoria,unidad_medida) values ('INVALID','Prueba','Prueba','unidad')",
        ),
      ).rejects.toThrow(/row-level security/i);
    });
  });
  it('filtra asignaciones a través de la autorización del proyecto', async () => {
    await asUser(alice, async () => {
      expect(
        (await db.query('select * from public.proyecto_materiales')).rows,
      ).toHaveLength(1);
    });
    await asUser(bob, async () => {
      expect(
        (await db.query('select * from public.proyecto_materiales')).rows,
      ).toHaveLength(0);
    });
  });
  it('permite actualizar el estado y fuerza updated_at del servidor', async () => {
    await asUser(alice, async () => {
      const { rows } = await db.query(
        "update public.proyectos set estado='Completado', updated_at='2000-01-01' where id=$1 returning estado, updated_at > '2000-01-01'::timestamptz as timestamp_correcto",
        [projectA],
      );
      expect(rows).toEqual([
        { estado: 'Completado', timestamp_correcto: true },
      ]);
    });
  });
  it('rechaza capacidades y fechas contrarias al contrato en PostgreSQL', async () => {
    await asUser(alice, async () => {
      await expect(
        db.query('update public.proyectos set capacidad_kw=0 where id=$1', [
          projectA,
        ]),
      ).rejects.toThrow(/check constraint/i);
      await expect(
        db.query(
          "update public.proyectos set fecha_estimada_fin='2026-11-19' where id=$1",
          [projectA],
        ),
      ).rejects.toThrow(/check constraint/i);
    });
  });
  it('deniega acceso anónimo y borrado', async () => {
    await db.exec('set role anon');
    try {
      await expect(db.query('select * from public.proyectos')).rejects.toThrow(
        /permission denied/i,
      );
    } finally {
      await db.exec('reset role');
    }
    await asUser(alice, async () => {
      await expect(
        db.query('delete from public.proyectos where id=$1', [projectA]),
      ).rejects.toThrow(/permission denied/i);
    });
  });
});
