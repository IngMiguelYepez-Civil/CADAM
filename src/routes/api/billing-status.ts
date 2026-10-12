import { createFileRoute } from '@tanstack/react-router';
import { json, preflight } from '@/server/api';
const unavailable = () =>
  json({ error: 'El consumo de IA se gestiona en tu cuenta OpenRouter.' }, 410);
export const Route = createFileRoute('/api/billing-status')({
  server: {
    handlers: { GET: unavailable, POST: unavailable, OPTIONS: preflight },
  },
});
