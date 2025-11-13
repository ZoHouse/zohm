import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasServiceRole = Boolean(supabaseUrl && serviceKey);

export const supabaseAdmin = hasServiceRole
  ? createClient(supabaseUrl, serviceKey as string)
  : null;


