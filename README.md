# SolarOps Manager

Aplicación interna React 18 + TypeScript estricto + Tailwind CSS v4 + Supabase. Incluye acceso por contraseña, proyectos protegidos por RLS, indicadores, búsqueda y sincronización entre sesiones.

## Instalación

Requiere Node.js 22.12+ (recomendado Node 24 LTS), npm y un proyecto Supabase nuevo.

```sh
npm ci
```

## Configurar Supabase

1. Crea un proyecto desde https://supabase.com/dashboard y guarda la contraseña de PostgreSQL en un gestor seguro.
2. Abre SQL Editor y ejecuta completo `supabase/schema.sql` con el rol propietario `postgres`. Es una migración inicial transaccional para una base nueva; no se debe ejecutar dos veces ni sobre tablas existentes. Crea enums, tablas, índices, triggers, permisos, RLS, semillas y publicación Realtime.
3. En Authentication > Users, crea los usuarios internos con correo confirmado. Desactiva el registro público en la configuración de Auth. Configura la URL del sitio y las URLs permitidas de tu entorno.
4. Cada usuario necesita un perfil. Desde SQL Editor, usa su UUID real de Authentication y ejecuta este ejemplo con sus datos:

```sql
insert into public.instaladores (id, nombre_completo, email, rol)
values ('UUID_REAL_DEL_USUARIO', 'Ana Instaladora', 'ana@empresa.com', 'instalador');
```

5. Para el primer administrador, usa el mismo procedimiento con `rol = 'admin'`. Los roles se almacenan en PostgreSQL, nunca en metadatos editables por el usuario. Los perfiles no se crean automáticamente; un usuario sin perfil activo no accede a datos. Mantén el correo del perfil sincronizado si cambia en Auth.
6. En Project Settings > API, copia Project URL y la clave pública `anon` (JWT heredada). Nunca uses `service_role` ni claves secretas en Vite.
7. Copia la plantilla y completa ambos valores:

```sh
cp .env.example .env
```

En PowerShell también puedes usar `Copy-Item .env.example .env`.

```dotenv
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_publica_anon
```

8. Ejecuta `npm run dev`, abre la URL indicada por Vite e inicia sesión. Reinicia Vite después de modificar `.env`. Sin configuración se muestra una pantalla informativa, sin peticiones al backend.

## Verificación y publicación

```sh
npm test
npm run build
npm run preview
```

Publica `dist/` en un hosting estático con HTTPS. Las variables `VITE_` se incorporan durante el build y son públicas: configura las variables en CI antes de compilar. `preview` sirve para comprobación local. No es un servidor de producción.

Antes de publicar, verifica RLS con dos instaladores y un administrador usando sesiones reales: un instalador no debe leer, crear ni reasignar proyectos del otro; un administrador activo puede acceder a todos; un perfil inactivo no accede a datos; usuarios anónimos no tienen permisos. Comprueba también un cambio de estado en dos navegadores. Si se pierde Realtime, la interfaz avisa y permite actualizar manualmente.

El inventario y las asignaciones tienen modelo y políticas; su administración visual no forma parte de esta entrega. Las asignaciones registran cantidades, sin descontar stock automáticamente. No se ofrece borrado: el alcance funcional solicitado es crear, consultar y actualizar estados.

## Comportamiento

- El instalador crea proyectos a su nombre; el administrador ve todos los proyectos y puede actualizar sus estados.
- Capacidad total suma todos los proyectos visibles; capacidad instalada suma únicamente los completados.
- La lista y sus métricas obedecen a RLS. No se envía un filtro de instalador desde el cliente.
- Validación en cliente y restricciones PostgreSQL protegen el contrato de datos.
- Las fechas se muestran sin conversión de zona horaria y la capacidad admite dos decimales, entre 0.01 y 9999.99 kW.

Consulta `ARCHITECTURE.md` para el contrato, ERD, decisiones de seguridad y trazabilidad SDD. La conexión, la migración y las pruebas de integración requieren un proyecto Supabase configurado; el build por sí solo no certifica el despliegue.

Las 26 pruebas de `npm test` incluyen 15 casos de validación y 11 del esquema SQL/RLS en PostgreSQL embebido (PGlite), con identidades simuladas y sin servicios externos.
