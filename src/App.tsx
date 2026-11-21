import { useState, type FormEvent } from 'react';
import {
  Sun,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { configurado, mensajeError } from './lib/supabase';
import { useProyectos } from './hooks/useProyectos';
import { DashboardStats } from './components/DashboardStats';
import { ProyectoForm } from './components/ProyectoForm';
import { ProyectoList } from './components/ProyectoList';
function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-xl bg-emerald-600 p-2 text-white">
        <Sun size={24} />
      </span>
      <div className="text-xl font-bold tracking-tight text-slate-900">
        SolarOps <span className="font-normal text-slate-400">Manager</span>
      </div>
    </div>
  );
}
function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (cause) {
      setError(mensajeError(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative flex flex-col justify-between overflow-hidden bg-emerald-950 p-8 text-white lg:p-16">
        <div className="flex items-center gap-3 text-xl font-semibold">
          <Sun className="text-emerald-300" /> SolarOps
        </div>
        <div className="relative py-16">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
            Energía que transforma
          </p>
          <h1 className="max-w-lg text-4xl font-semibold leading-tight lg:text-6xl">
            Cada instalación,
            <br />
            <span className="text-emerald-300">un futuro mejor.</span>
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-emerald-100/70">
            Conecta la planificación y la ejecución de tus proyectos solares en
            un solo lugar.
          </p>
          <div
            aria-hidden="true"
            className="mt-12 grid max-w-sm -skew-y-6 grid-cols-4 gap-2"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="h-14 rounded-md border border-emerald-400/25 bg-emerald-800/50"
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-emerald-200/60">
          Gestión de proyectos · Operación interna
        </p>
      </section>
      <section className="flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-sm">
          <Brand />
          <h2 className="mt-12 text-2xl font-semibold text-slate-900">
            Bienvenido de nuevo
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Ingresa con tu cuenta de instalador.
          </p>
          {!configurado && (
            <p role="alert" className="notice mt-6">
              Configura las variables de .env y reinicia el servidor para
              conectar Supabase. Consulta README.md.
            </p>
          )}
          <form
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              void submit(e);
            }}
          >
            <fieldset disabled={busy || !configurado} className="space-y-5">
              <div>
                <label htmlFor="email" className="label">
                  Correo electrónico
                </label>
                <input
                  className="input"
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="label">
                  Contraseña
                </label>
                <input
                  className="input"
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="button w-full justify-center">
                {busy ? 'Ingresando…' : 'Iniciar sesión'}
                <ArrowRight size={17} />
              </button>
            </fieldset>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
          </form>
          <p className="mt-8 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={16} /> Acceso exclusivo para personal autorizado
          </p>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            Si necesitas una cuenta o recuperar tu acceso, contacta al
            administrador de tu organización.
          </p>
        </div>
      </section>
    </main>
  );
}
function Dashboard() {
  const { user, signOut } = useAuth();
  const {
    proyectos,
    loading,
    error,
    realtimeError,
    crearProyecto,
    actualizarEstado,
    recargar,
  } = useProyectos();
  const [logoutError, setLogoutError] = useState('');
  const [leaving, setLeaving] = useState(false);
  async function logout() {
    setLeaving(true);
    setLogoutError('');
    try {
      await signOut();
    } catch (cause) {
      setLogoutError(mensajeError(cause));
    } finally {
      setLeaving(false);
    }
  }
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-6 py-5 lg:px-10">
          <Brand />
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-slate-500 sm:block">
              {user?.email}
            </span>
            <button
              className="flex items-center gap-2 rounded-lg p-2 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              disabled={leaving}
              onClick={() => {
                void logout();
              }}
            >
              <LogOut size={16} />
              {leaving ? 'Saliendo…' : 'Salir'}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-emerald-700">
              <LayoutDashboard size={14} /> CENTRO DE OPERACIONES
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Panel de proyectos
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Una visión clara de tus instalaciones solares.
            </p>
          </div>
          <button
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            disabled={loading}
            onClick={() => {
              void recargar();
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
        {(error || realtimeError || logoutError) && (
          <div role="alert" className="notice mb-5">
            {error || realtimeError || logoutError}
          </div>
        )}
        <DashboardStats proyectos={proyectos} />
        <div className="mt-7 grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <ProyectoForm crearProyecto={crearProyecto} />
          <ProyectoList
            proyectos={proyectos}
            loading={loading}
            actualizarEstado={actualizarEstado}
          />
        </div>
        <footer className="mt-8 border-t border-slate-200 pt-5 text-xs text-slate-400">
          SolarOps Manager · Gestión de energía solar
        </footer>
      </main>
    </div>
  );
}
export default function App() {
  const { session, loading, error } = useAuth();
  if (loading)
    return (
      <main
        role="status"
        className="flex min-h-screen items-center justify-center text-emerald-700"
      >
        Cargando sesión…
      </main>
    );
  return (
    <>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {session ? <Dashboard key={session.user.id} /> : <Login />}
    </>
  );
}
