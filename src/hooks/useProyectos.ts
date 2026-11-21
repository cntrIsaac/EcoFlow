import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabase, mensajeError } from '../lib/supabase';
import type {
  EstadoProyecto,
  Proyecto,
  ProyectoInsert,
} from '../types/database.types';
export function useProyectos() {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const version = useRef(0);
  const cargar = useCallback(async () => {
    const request = ++version.current;
    try {
      const { data, error: queryError } = await getSupabase()
        .from('proyectos')
        .select('*')
        .order('created_at', { ascending: false });
      if (request !== version.current) return;
      if (queryError) throw new Error(queryError.message);
      setProyectos(data);
      setError(null);
    } catch (cause) {
      if (request === version.current) setError(mensajeError(cause));
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!user) {
      setProyectos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void cargar();
    const client = getSupabase();
    const channel = client
      .channel(`proyectos-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proyectos' },
        () => {
          void cargar();
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeError(null);
          void cargar();
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')
          setRealtimeError(
            'Sin conexión en tiempo real. Usa Actualizar para consultar los cambios.',
          );
      });
    return () => {
      version.current++;
      void client.removeChannel(channel);
    };
  }, [user, cargar]);
  async function crearProyecto(values: Omit<ProyectoInsert, 'instalador_id'>) {
    if (!user) throw new Error('Inicia sesión para crear proyectos.');
    const { data, error: insertError } = await getSupabase()
      .from('proyectos')
      .insert({ ...values, instalador_id: user.id })
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);
    setProyectos((current) => [
      data,
      ...current.filter((p) => p.id !== data.id),
    ]);
    setError(null);
    await cargar();
  }
  async function actualizarEstado(id: string, estado: EstadoProyecto) {
    const { data, error: updateError } = await getSupabase()
      .from('proyectos')
      .update({ estado })
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw new Error(updateError.message);
    setProyectos((current) => current.map((p) => (p.id === id ? data : p)));
    setError(null);
    await cargar();
  }
  return {
    proyectos,
    loading,
    error,
    realtimeError,
    crearProyecto,
    actualizarEstado,
    recargar: cargar,
  };
}
