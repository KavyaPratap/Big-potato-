/**
 * supabase/client.ts
 * Browser-side Supabase client (Vite/React).
 * Import this anywhere in the frontend to query Supabase directly.
 *
 * Usage:
 *   import { supabase } from '@/utils/supabase/client'
 *   const { data } = await supabase.from('readings').select('*').limit(10)
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
