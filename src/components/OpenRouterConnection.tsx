import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  beginOpenRouterAuth,
  disconnectOpenRouter,
  finishOpenRouterAuth,
  loadOpenRouterCatalog,
  selectOpenRouterModel,
  useOpenRouter,
} from '@/lib/openrouter';

export function OpenRouterModelPicker({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const state = useOpenRouter();
  const [error, setError] = useState('');
  useEffect(() => {
    void loadOpenRouterCatalog().catch(() =>
      setError('No se pudo cargar el catálogo.'),
    );
  }, []);
  return (
    <div className="min-w-0">
      <label className="sr-only" htmlFor="mrbim-openrouter-model">
        Modelo OpenRouter
      </label>
      <select
        id="mrbim-openrouter-model"
        aria-label="Modelo OpenRouter"
        className="max-w-full rounded-md border border-adam-neutral-700 bg-adam-background-2 p-2 text-sm text-adam-neutral-50"
        value={state.model}
        disabled={disabled || !state.models.length}
        onChange={(e) => selectOpenRouterModel(e.target.value)}
      >
        {!state.models.length && (
          <option value="">{error || 'Cargando modelos…'}</option>
        )}
        {state.models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
            {m.vision ? ' · visión' : ''}
          </option>
        ))}
      </select>
      {error && (
        <button
          type="button"
          className="ml-2 text-sm underline"
          onClick={() => {
            setError('');
            void loadOpenRouterCatalog().catch(() =>
              setError('No se pudo cargar el catálogo.'),
            );
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

export function OpenRouterConnection() {
  const { user } = useAuth();
  const state = useOpenRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!user) return;
    setBusy(true);
    void finishOpenRouterAuth(user.id)
      .catch((e: unknown) =>
        setError(
          e instanceof Error ? e.message : 'No se pudo conectar OpenRouter.',
        ),
      )
      .finally(() => setBusy(false));
  }, [user?.id]);
  const connected = !!user && state.connected && state.owner === user.id;
  const model = state.models.find((m) => m.id === state.model);
  return (
    <section className="rounded-xl border border-adam-neutral-800 bg-adam-background-2 p-6 text-adam-neutral-50">
      <h2 className="mb-3 text-lg font-medium">Tu IA con OpenRouter</h2>
      <p className="mb-4 text-sm text-adam-neutral-200">
        Conecta tu cuenta y paga las generaciones con tu saldo de OpenRouter.
        MrBIM no aporta saldo de IA.
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button
          disabled={!user || busy}
          onClick={() => {
            setError('');
            setBusy(true);
            void beginOpenRouterAuth(user!.id).catch(() => {
              setError('No se pudo iniciar la conexión.');
              setBusy(false);
            });
          }}
        >
          {busy
            ? 'Conectando…'
            : connected
              ? 'Cambiar conexión'
              : 'Conectar OpenRouter'}
        </Button>
        {connected && (
          <Button variant="dark" onClick={disconnectOpenRouter}>
            Desconectar
          </Button>
        )}
        <span className="text-sm">
          {connected ? 'Cuenta conectada' : 'Sin conexión'}
        </span>
      </div>
      <OpenRouterModelPicker />
      {model && (
        <p className="mt-3 text-sm">
          Precio de catálogo por millón de tokens: entrada USD{' '}
          {(model.inputPrice * 1000000).toFixed(3)} · salida USD{' '}
          {(model.outputPrice * 1000000).toFixed(3)}. El total depende del uso y
          de las condiciones del proveedor.
        </p>
      )}
      <p className="mt-3 text-sm text-adam-neutral-200">
        La conexión se conserva en memoria durante esta sesión de página. Al
        recargar, conecta de nuevo. Desconectar borra la credencial de MrBIM;
        puedes revocarla en OpenRouter.
      </p>
      <a
        className="mt-3 inline-block text-sm underline"
        href="https://openrouter.ai/keys"
        target="_blank"
        rel="noopener noreferrer"
      >
        Saldo, límites y claves en OpenRouter
      </a>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}

export function OpenRouterStatus() {
  const { user } = useAuth();
  const state = useOpenRouter();
  const connected = !!user && state.connected && state.owner === user.id;
  return (
    <p className="text-sm text-adam-neutral-200">
      {connected
        ? 'IA conectada: el consumo se carga a tu cuenta OpenRouter.'
        : 'Conecta tu cuenta OpenRouter antes de generar.'}{' '}
      <Link to="/settings" className="underline">
        Configurar IA
      </Link>
    </p>
  );
}
