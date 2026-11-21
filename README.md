# SolarOps Manager

Aplicación interna para gestionar proyectos de instalación de paneles solares, desarrollada con React 18, TypeScript estricto, Tailwind CSS v4 y Supabase bajo una metodología Specification-Driven Development (SDD).

La aplicación integra autenticación por correo y contraseña, proyectos protegidos por RLS, indicadores operativos, búsqueda y sincronización entre sesiones mediante Supabase Realtime.

## Configuración de Supabase

El backend está configurado en Supabase con PostgreSQL, Auth y Realtime. La estructura de la base de datos está definida en `supabase/schema.sql`, una migración inicial transaccional que establece:

- El enum `estado_proyecto`: `Pendiente`, `En Progreso` y `Completado`.
- Las tablas `instaladores`, `proyectos`, `materiales` y `proyecto_materiales`.
- Claves primarias y foráneas, índices y restricciones de integridad.
- Políticas RLS en todas las tablas y funciones de autorización para perfiles activos y administradores.
- Actualización automática de `updated_at` en los proyectos.
- Cuatro materiales iniciales y la publicación de `proyectos` en Realtime.

La migración corresponde a la creación inicial del esquema y se ejecuta una sola vez por entorno.

### Usuarios y perfiles

El acceso se administra mediante cuentas internas en Supabase Auth y perfiles en `public.instaladores`, vinculados por el mismo UUID. Las contraseñas se gestionan exclusivamente en Auth; la tabla `instaladores` almacena los datos del perfil, su rol y su estado de activación.

El esquema de acceso utiliza dos roles:

- `admin`: consulta todos los proyectos y administra perfiles y materiales.
- `instalador`: consulta y modifica sus propios proyectos.

El registro público está deshabilitado y las cuentas internas se aprovisionan desde la administración de Supabase. Cada cuenta dispone de un perfil con `nombre_completo`, `email`, `rol` y `activo`; `telefono` y `certificacion` son opcionales y `created_at` se genera automáticamente.

Este es el formato utilizado para incorporar nuevos perfiles después de crear la cuenta en Auth:

```sql
insert into public.instaladores (
  id,
  nombre_completo,
  email,
  telefono,
  certificacion,
  rol,
  activo
)
values (
  'UUID_DEL_USUARIO_EN_AUTH',
  'Ana Instaladora',
  'ana@empresa.com',
  null,
  null,
  'instalador',
  true
);
```

Los privilegios se resuelven desde PostgreSQL. Un perfil inactivo no tiene acceso a los datos y un instalador no puede modificar su rol ni reasignar sus proyectos a otro usuario.

## Ejecución local

Requisitos: Node.js 22.12 o superior (recomendado Node 24 LTS) y npm.

Desde la carpeta que contiene `package.json`:

```sh
npm ci
npm run dev
```

La conexión utiliza las variables del archivo `.env`, ubicado junto a `package.json`:

```dotenv
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_publica
```

`VITE_SUPABASE_ANON_KEY` contiene la clave pública del proyecto. Las claves privilegiadas y las contraseñas de PostgreSQL permanecen fuera del frontend. `.env` está excluido del repositorio; `.env.example` documenta las variables para reproducir la configuración en otros equipos.

Al modificar las variables de entorno, se reinicia el servidor de Vite. El inicio de sesión utiliza el correo y la contraseña de la cuenta interna de Supabase Auth.

## Funcionalidades

- Creación de proyectos con validación de cliente, dirección, capacidad y fechas.
- Seguimiento por estado: `Pendiente`, `En Progreso` y `Completado`.
- Indicadores por estado, capacidad total y capacidad instalada en proyectos completados.
- Búsqueda por cliente o dirección.
- Cambios de estado confirmados por el servidor y sincronizados mediante Realtime.
- Actualización manual y mensajes de error cuando se interrumpe la conexión.

Los instaladores crean proyectos a su nombre. El administrador visualiza todos los proyectos y puede actualizar sus estados. Las consultas delegan el filtrado de acceso en RLS, sin filtros manuales por instalador en el cliente.

La capacidad admite valores entre 0.01 y 9999.99 kW, con dos decimales. Las fechas se muestran sin conversiones de zona horaria y la fecha estimada de finalización es igual o posterior al inicio.

El inventario y las asignaciones cuentan con modelo y políticas de acceso. Las asignaciones registran cantidades y el stock se mantiene de forma independiente. La interfaz de proyectos permite crear, consultar y actualizar estados.

## Verificación

La compilación de producción y las 26 pruebas automatizadas se ejecutaron correctamente. La auditoría de dependencias realizada durante la entrega no reportó vulnerabilidades.

```sh
npm test
npm run build
```

La suite incluye 15 casos de validación y 11 pruebas del esquema SQL y sus políticas RLS en PostgreSQL embebido (PGlite), con identidades simuladas. Comprueba aislamiento entre instaladores, acceso de administradores, perfiles inactivos, protección de roles, restricciones y actualización de timestamps.

## Distribución

`npm run build` genera la aplicación estática en `dist/`. El artefacto se sirve mediante un hosting con HTTPS. Las variables `VITE_` se incorporan durante la compilación y contienen únicamente configuración pública.

La vista previa local del artefacto se inicia con:

```sh
npm run preview
```

## Documentación técnica

`ARCHITECTURE.md` describe el contrato de datos, el diagrama ERD en Mermaid, las decisiones de seguridad RLS, el uso de `SECURITY DEFINER` y la trazabilidad del desarrollo guiado por especificaciones.
