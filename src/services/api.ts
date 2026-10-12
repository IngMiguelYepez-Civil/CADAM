import { openRouterHeaders } from '@/lib/openrouter';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

export function apiUrl(path: string) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${basePath}/api/${path}`;
}

export async function apiJson(
  path: string,
  init?: RequestInit,
): Promise<unknown>;
export async function apiJson<T>(
  path: string,
  init: RequestInit,
  schema: z.ZodType<T>,
): Promise<T>;
export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
  schema?: z.ZodType<T>,
): Promise<T | unknown> {
  const session = (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;
  const visitorHeaders =
    path === 'prompt-generator' && session
      ? openRouterHeaders(session.user.id)
      : {};
  const url = apiUrl(path);
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...visitorHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const contentType = response.headers.get('Content-Type') ?? '';
  if (!contentType.includes('application/json')) {
    const preview = (await response.text()).slice(0, 160);
    throw new Error(`Unexpected API response from ${url}: ${preview}`);
  }
  const data: unknown = await response.json();
  if (!response.ok) {
    const errorValue =
      typeof data === 'object' && data !== null
        ? Reflect.get(data, 'error')
        : undefined;
    throw new Error(
      typeof errorValue === 'string' ? errorValue : response.statusText,
    );
  }
  return schema ? schema.parse(data) : data;
}
