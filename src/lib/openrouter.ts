import { useSyncExternalStore } from 'react';
import {
  validPendingAuthorization,
  isOpenRouterKey,
  OPENROUTER_KEY_HEADER,
  OPENROUTER_MODEL_HEADER,
  parseOpenRouterCatalog,
  type OpenRouterCatalogModel,
} from '@shared/openrouter';

const PENDING_AUTH = 'mrbim-openrouter-pkce';
type Snapshot = {
  connected: boolean;
  owner: string | null;
  model: string;
  models: OpenRouterCatalogModel[];
};
const initial: Snapshot = {
  connected: false,
  owner: null,
  model: '',
  models: [],
};
let snapshot = initial;
let visitorKey: string | null = null;
let activeAccount: string | null = null;
let connectionGeneration = 0;
const listeners = new Set<() => void>();
let catalogPromise: Promise<void> | null = null;
let authPromise: Promise<void> | null = null;

function update(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}
export function useOpenRouter() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => snapshot,
    () => initial,
  );
}
export function disconnectOpenRouter() {
  connectionGeneration++;
  visitorKey = null;
  update({ connected: false, owner: null });
}
export function clearOpenRouterForAccount(owner: string | null) {
  activeAccount = owner;
  if (snapshot.owner !== owner) disconnectOpenRouter();
}
export function selectOpenRouterModel(model: string) {
  if (snapshot.models.some((m) => m.id === model)) update({ model });
}
export function openRouterHeaders(owner: string): Record<string, string> {
  if (snapshot.owner !== owner || !visitorKey || !snapshot.model)
    throw new Error(
      'Conecta tu cuenta OpenRouter y elige un modelo en Configuración.',
    );
  return {
    [OPENROUTER_KEY_HEADER]: visitorKey,
    [OPENROUTER_MODEL_HEADER]: snapshot.model,
  };
}
export async function loadOpenRouterCatalog() {
  if (snapshot.models.length) return;
  catalogPromise ??= (async () => {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok)
      throw new Error('No se pudo cargar el catálogo de OpenRouter.');
    const models = parseOpenRouterCatalog(await response.json());
    if (!models.length)
      throw new Error(
        'OpenRouter no devolvió modelos compatibles con herramientas CAD.',
      );
    update({
      models,
      model: models.some((m) => m.id === snapshot.model)
        ? snapshot.model
        : models[0].id,
    });
  })().finally(() => {
    catalogPromise = null;
  });
  return catalogPromise;
}
function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
export async function beginOpenRouterAuth(owner: string) {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const state = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
    ),
  );
  const callback = new URL(
    `${import.meta.env.BASE_URL.replace(/\/$/, '')}/settings`,
    window.location.origin,
  );
  sessionStorage.setItem(
    PENDING_AUTH,
    JSON.stringify({ verifier, state, owner, createdAt: Date.now() }),
  );
  const url = new URL('https://openrouter.ai/auth');
  url.searchParams.set('callback_url', callback.href);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  url.searchParams.set('key_label', 'MrBIM Component Studio');
  window.location.assign(url.href);
}
export function finishOpenRouterAuth(owner: string): Promise<void> {
  // Reuse in-flight work across React StrictMode effects; codes are single-use.
  if (authPromise) return authPromise;
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (!code && !error) return Promise.resolve();
  const state = url.searchParams.get('state');
  for (const field of ['code', 'state', 'error', 'error_description'])
    url.searchParams.delete(field);
  window.history.replaceState(null, '', url.href);
  const saved = sessionStorage.getItem(PENDING_AUTH);
  sessionStorage.removeItem(PENDING_AUTH);
  const generation = connectionGeneration;
  authPromise = (async () => {
    if (error) throw new Error('La autorización OpenRouter fue cancelada.');
    const pending = saved ? JSON.parse(saved) : null;
    if (!validPendingAuthorization(pending, state, owner)) {
      throw new Error(
        'La conexión expiró o no corresponde a esta cuenta. Vuelve a conectar OpenRouter.',
      );
    }
    const response = await fetch('https://openrouter.ai/api/v1/auth/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        code_verifier: pending.verifier,
        code_challenge_method: 'S256',
      }),
    });
    if (!response.ok)
      throw new Error('OpenRouter no pudo completar la autorización.');
    const result: unknown = await response.json();
    const key =
      result && typeof result === 'object' && 'key' in result
        ? result.key
        : null;
    if (!isOpenRouterKey(key))
      throw new Error('OpenRouter no devolvió una credencial válida.');
    if (activeAccount !== owner || generation !== connectionGeneration)
      throw new Error(
        'La cuenta cambió durante la conexión. Vuelve a conectar OpenRouter.',
      );
    visitorKey = key;
    update({ connected: true, owner });
  })().finally(() => {
    authPromise = null;
  });
  return authPromise;
}
