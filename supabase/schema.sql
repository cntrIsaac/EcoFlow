begin;

create type public.estado_proyecto as enum ('Pendiente', 'En Progreso', 'Completado');

create table public.instaladores (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text not null check (length(trim(nombre_completo)) >= 3),
  email text not null unique,
  telefono text,
  certificacion text,
  rol text not null default 'instalador' check (rol in ('admin', 'instalador')),
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.proyectos (
  id uuid primary key default gen_random_uuid(),
  nombre_cliente text not null check (length(trim(nombre_cliente)) >= 3),
  direccion_instalacion text not null check (length(trim(direccion_instalacion)) >= 5),
  capacidad_kw numeric(6,2) not null check (capacidad_kw > 0 and capacidad_kw <> 'NaN'::numeric),
  estado public.estado_proyecto not null default 'Pendiente',
  fecha_inicio date not null,
  fecha_estimada_fin date,
  instalador_id uuid not null references public.instaladores(id),
  notas_tecnicas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fecha_estimada_fin is null or fecha_estimada_fin >= fecha_inicio)
);
create index proyectos_instalador_idx on public.proyectos(instalador_id);

create table public.materiales (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  nombre text not null,
  categoria text not null,
  unidad_medida text not null,
  stock_disponible numeric(12,2) not null default 0 check (stock_disponible >= 0 and stock_disponible <> 'NaN'::numeric)
);

create table public.proyecto_materiales (
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  material_id uuid not null references public.materiales(id),
  cantidad_asignada numeric(12,2) not null check (cantidad_asignada > 0 and cantidad_asignada <> 'NaN'::numeric),
  primary key (proyecto_id, material_id)
);
create index proyecto_materiales_material_idx on public.proyecto_materiales(material_id);

create function public.es_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.instaladores where id = (select auth.uid()) and rol = 'admin' and activo);
$$;

create function public.es_activo() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.instaladores where id = (select auth.uid()) and activo);
$$;

revoke all on function public.es_admin() from public, anon;
revoke all on function public.es_activo() from public, anon;
grant execute on function public.es_admin(), public.es_activo() to authenticated;

create function public.actualizar_timestamp() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.actualizar_timestamp() from public, anon, authenticated;
create trigger proyectos_updated_at before update on public.proyectos
for each row execute function public.actualizar_timestamp();

alter table public.instaladores enable row level security;
alter table public.proyectos enable row level security;
alter table public.materiales enable row level security;
alter table public.proyecto_materiales enable row level security;

revoke all on public.instaladores, public.proyectos, public.materiales, public.proyecto_materiales from anon, authenticated;
grant select, insert, update on public.instaladores, public.proyectos, public.materiales, public.proyecto_materiales to authenticated;

create policy instaladores_select on public.instaladores for select to authenticated
using ((id = (select auth.uid()) and (select public.es_activo())) or (select public.es_admin()));
create policy instaladores_insert on public.instaladores for insert to authenticated with check ((select public.es_admin()));
create policy instaladores_update on public.instaladores for update to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

create policy proyectos_select on public.proyectos for select to authenticated
using ((select public.es_activo()) and (instalador_id = (select auth.uid()) or (select public.es_admin())));
create policy proyectos_insert on public.proyectos for insert to authenticated
with check ((select public.es_activo()) and (instalador_id = (select auth.uid()) or (select public.es_admin())));
create policy proyectos_update on public.proyectos for update to authenticated
using ((select public.es_activo()) and (instalador_id = (select auth.uid()) or (select public.es_admin())))
with check ((select public.es_activo()) and (instalador_id = (select auth.uid()) or (select public.es_admin())));

create policy materiales_select on public.materiales for select to authenticated using ((select public.es_activo()));
create policy materiales_insert on public.materiales for insert to authenticated with check ((select public.es_admin()));
create policy materiales_update on public.materiales for update to authenticated
using ((select public.es_admin())) with check ((select public.es_admin()));

create policy asignaciones_select on public.proyecto_materiales for select to authenticated
using (exists (select 1 from public.proyectos p where p.id = proyecto_id));
create policy asignaciones_insert on public.proyecto_materiales for insert to authenticated
with check (exists (select 1 from public.proyectos p where p.id = proyecto_id));
create policy asignaciones_update on public.proyecto_materiales for update to authenticated
using (exists (select 1 from public.proyectos p where p.id = proyecto_id))
with check (exists (select 1 from public.proyectos p where p.id = proyecto_id));

insert into public.materiales (sku, nombre, categoria, unidad_medida, stock_disponible) values
('PANEL-550', 'Panel monocristalino 550 W', 'Paneles', 'unidad', 120),
('INV-5K', 'Inversor 5 kW', 'Inversores', 'unidad', 24),
('CABLE-6', 'Cable solar 6 mmÂ²', 'Cableado', 'metro', 1500),
('EST-AL', 'Estructura de aluminio', 'Estructuras', 'kit', 60);

alter publication supabase_realtime add table public.proyectos;
commit;

