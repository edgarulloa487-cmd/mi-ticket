import { createClient } from '@supabase/supabase-js'
import type { Database } from './tipos'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env.',
  )
}

/**
 * Esta llave vive en el navegador a propósito: no es un secreto. Lo que protege
 * los datos es la RLS, y las tablas solo tienen permiso de SELECT sobre lo
 * propio — toda escritura pasa por las funciones de la base.
 */
export const supabase = createClient<Database>(url, key)
