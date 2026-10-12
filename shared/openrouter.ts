// Shared protocol: only a visitor's key can authorize inference in MrBIM.
export const OPENROUTER_KEY_HEADER = 'x-mrbim-openrouter-key';
export const OPENROUTER_MODEL_HEADER = 'x-mrbim-openrouter-model';
export const MAX_AUTOMATIC_BUILDS = 3;

// Count only builds since the last user instruction, across SSE continuations.
export function withinAutomaticBuildLimit(
  messages: Array<{ role: string; parts: Array<{ type: string }> }>,
) {
  let builds = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') break;
    builds += messages[i].parts.filter(
      (part) => part.type === 'tool-build_parametric_model',
    ).length;
  }
  return builds < MAX_AUTOMATIC_BUILDS;
}

export function validPendingAuthorization(
  pending: unknown,
  state: string | null,
  owner: string,
  now = Date.now(),
): pending is {
  verifier: string;
  state: string;
  owner: string;
  createdAt: number;
} {
  if (!pending || typeof pending !== 'object') return false;
  const value = pending as Record<string, unknown>;
  return (
    typeof state === 'string' &&
    state.length >= 32 &&
    value.state === state &&
    value.owner === owner &&
    typeof value.verifier === 'string' &&
    /^[A-Za-z0-9_-]{43,128}$/.test(value.verifier) &&
    typeof value.createdAt === 'number' &&
    now >= value.createdAt &&
    now - value.createdAt <= 600000
  );
}

export function isOpenRouterKey(value: unknown): value is string {
  return (
    typeof value === 'string' && /^sk-or-v1-[A-Za-z0-9_-]{20,256}$/.test(value)
  );
}

export function isOpenRouterModel(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.:\/-]{1,180}$/.test(value)
  );
}

export function visitorCredentials(headers: Headers) {
  const key = headers.get(OPENROUTER_KEY_HEADER);
  const model = headers.get(OPENROUTER_MODEL_HEADER);
  if (!isOpenRouterKey(key) || !isOpenRouterModel(model)) return null;
  return { key, model };
}

export function localConversationTitle(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 80) || 'Nuevo componente';
}

export type OpenRouterCatalogModel = {
  id: string;
  name: string;
  vision: boolean;
  inputPrice: number;
  outputPrice: number;
};

export function parseOpenRouterCatalog(
  value: unknown,
): OpenRouterCatalogModel[] {
  if (
    !value ||
    typeof value !== 'object' ||
    !('data' in value) ||
    !Array.isArray(value.data)
  )
    return [];
  return value.data
    .flatMap((entry: unknown) => {
      if (!entry || typeof entry !== 'object') return [];
      const m = entry as Record<string, unknown>;
      if (!isOpenRouterModel(m.id) || typeof m.name !== 'string') return [];
      const params = m.supported_parameters;
      if (!Array.isArray(params) || !params.includes('tools')) return [];
      const pricing = m.pricing as Record<string, unknown> | undefined;
      const inputPrice = Number(pricing?.prompt);
      const outputPrice = Number(pricing?.completion);
      if (
        !Number.isFinite(inputPrice) ||
        inputPrice < 0 ||
        !Number.isFinite(outputPrice) ||
        outputPrice < 0
      )
        return [];
      const architecture = m.architecture as
        | Record<string, unknown>
        | undefined;
      const inputs = architecture?.input_modalities;
      if (!Array.isArray(inputs) || !inputs.includes('image')) return [];
      return [
        {
          id: m.id,
          name: m.name,
          vision: Array.isArray(inputs) && inputs.includes('image'),
          inputPrice,
          outputPrice,
        },
      ];
    })
    .sort(
      (a, b) => a.inputPrice - b.inputPrice || a.name.localeCompare(b.name),
    );
}
