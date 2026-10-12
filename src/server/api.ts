import type { User } from '@supabase/supabase-js';
import { getAnonSupabaseClient } from './supabaseClient';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-mrbim-openrouter-key, x-mrbim-openrouter-model',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders,
  });
}

export function preflight() {
  return new Response('ok', { headers: corsHeaders });
}

export function methodNotAllowed() {
  return json({ error: 'method_not_allowed' }, 405);
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof Error && error.message === 'Unauthorized';
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function requireUser(request: Request): Promise<User> {
  const supabase = getAnonSupabaseClient({
    global: {
      headers: { Authorization: request.headers.get('Authorization') ?? '' },
    },
  });
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) throw new Error('Unauthorized');
  return data.user;
}
