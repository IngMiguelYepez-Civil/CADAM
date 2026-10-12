import { Link } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenRouter } from '@/lib/openrouter';
export function CreditsButton() {
  const { user } = useAuth();
  const state = useOpenRouter();
  if (!user) return null;
  return (
    <Link
      to="/settings"
      className="rounded-full border border-adam-neutral-700 px-3 py-1 text-sm text-adam-neutral-200"
    >
      {state.connected && state.owner === user.id
        ? 'OpenRouter conectado'
        : 'Conectar mi IA'}
    </Link>
  );
}
