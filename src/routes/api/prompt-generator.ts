import { createFileRoute } from '@tanstack/react-router';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { visitorCredentials } from '@shared/openrouter';
import {
  isRecord,
  isUnauthorizedError,
  json,
  methodNotAllowed,
  preflight,
  requireUser,
} from '@/server/api';

const CREATIVE_PROMPT =
  'Generate a short creative prompt for an organic 3D form, character, figurine, sculpture, or artistic object. Return only the prompt text.';
const PARAMETRIC_PROMPT =
  'Generate a short prompt for a practical dimensional household object or functional part. Include dimensions when useful. Return only the prompt text.';
const MAX_EXISTING_TEXT_LENGTH = 2000;

export const Route = createFileRoute('/api/prompt-generator')({
  server: {
    handlers: {
      GET: methodNotAllowed,
      OPTIONS: preflight,
      POST: async ({ request }) => {
        try {
          await requireUser(request);
          const credentials = visitorCredentials(request.headers);
          if (!credentials)
            return json(
              { error: 'Conecta tu cuenta OpenRouter en Configuración.' },
              428,
            );
          const body = await request.json().catch(() => ({}));
          if (!isRecord(body)) {
            return json({ error: 'invalid_request' }, 400);
          }
          if (
            body.existingText !== undefined &&
            (typeof body.existingText !== 'string' ||
              body.existingText.length > MAX_EXISTING_TEXT_LENGTH)
          ) {
            return json({ error: 'invalid_existing_text' }, 400);
          }
          const existingText = body.existingText;
          const base =
            body.type === 'parametric' ? PARAMETRIC_PROMPT : CREATIVE_PROMPT;
          const content = existingText
            ? `${base}\n\nImprove this existing prompt while preserving its intent:\n${existingText}`
            : base;
          const result = await generateText({
            model: createOpenRouter({ apiKey: credentials.key }).chat(
              credentials.model,
            ),
            maxOutputTokens: 300,
            maxRetries: 0,
            timeout: { totalMs: 30000 },
            system:
              'Write a concise CAD prompt. Return only the prompt text, no quotes or explanation.',
            prompt: content,
          });
          const prompt = result.text;
          return json({ prompt });
        } catch (err) {
          return json(
            {
              error: isUnauthorizedError(err)
                ? 'Unauthorized'
                : 'prompt_failed',
            },
            isUnauthorizedError(err) ? 401 : 500,
          );
        }
      },
    },
  },
});
