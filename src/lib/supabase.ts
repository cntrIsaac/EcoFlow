import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
function configuracionValida(): boolean {
  if (
    !url ||
    !key ||
    url.includes('YOUR_PROJECT') ||
    key === 'YOUR_PUBLIC_ANON_KEY'
  )
    return false;
  try {
    return ['https:', 'http:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}
export const configurado = configuracionValida();
export const supabase =
  configurado && url && key ? createClient<Database>(url, key) : null;
export function getSupabase() {
  if (!supabase)
    throw new Error(
      'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.',
    );
  return supabase;
}
export function mensajeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No se pudo completar la operación. Intenta nuevamente.';
}
