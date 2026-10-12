import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  visitorCredentials,
  OPENROUTER_KEY_HEADER,
  OPENROUTER_MODEL_HEADER,
  validPendingAuthorization,
  parseOpenRouterCatalog,
  withinAutomaticBuildLimit,
  localConversationTitle,
} from './openrouter.ts';

describe('visitor-owned inference boundary', () => {
  it('never substitutes a server key when visitor credentials are missing', () => {
    process.env.OPENROUTER_API_KEY = 'server-key-must-not-be-used';
    assert.equal(visitorCredentials(new Headers()), null);
    const headers = new Headers({
      [OPENROUTER_KEY_HEADER]: 'sk-or-v1-' + 'a'.repeat(64),
      [OPENROUTER_MODEL_HEADER]: 'vendor/vision-coder',
    });
    assert.equal(visitorCredentials(headers)?.model, 'vendor/vision-coder');
    headers.delete(OPENROUTER_MODEL_HEADER);
    assert.equal(visitorCredentials(headers), null);
    headers.set(OPENROUTER_MODEL_HEADER, 'https://attacker.test/model');
    assert.equal(visitorCredentials(headers), null);
    delete process.env.OPENROUTER_API_KEY;
  });
  it('rejects expired, cross-account, forged and malformed OAuth callbacks', () => {
    const now = 2000000;
    const pending = {
      state: 's'.repeat(43),
      verifier: 'v'.repeat(43),
      owner: 'miguel',
      createdAt: now - 1000,
    };
    assert.ok(validPendingAuthorization(pending, pending.state, 'miguel', now));
    assert.equal(
      validPendingAuthorization(pending, null, 'miguel', now),
      false,
    );
    assert.equal(
      validPendingAuthorization(pending, 'wrong-state', 'miguel', now),
      false,
    );
    assert.equal(
      validPendingAuthorization(pending, pending.state, 'another-user', now),
      false,
    );
    assert.equal(
      validPendingAuthorization(
        { ...pending, createdAt: now - 600001 },
        pending.state,
        'miguel',
        now,
      ),
      false,
    );
    assert.equal(
      validPendingAuthorization(
        { ...pending, createdAt: now + 1 },
        pending.state,
        'miguel',
        now,
      ),
      false,
    );
    assert.equal(
      validPendingAuthorization(
        { ...pending, verifier: 'short' },
        pending.state,
        'miguel',
        now,
      ),
      false,
    );
  });
  it('exposes only vision and tool models with usable live pricing', () => {
    const model = {
      id: 'vendor/cad',
      name: 'CAD',
      supported_parameters: ['tools'],
      architecture: { input_modalities: ['text', 'image'] },
      pricing: { prompt: '0.000001', completion: '0.000002' },
    };
    const result = parseOpenRouterCatalog({
      data: [
        model,
        { ...model, id: 'vendor/no-tools', supported_parameters: [] },
        {
          ...model,
          id: 'vendor/no-vision',
          architecture: { input_modalities: ['text'] },
        },
        { ...model, id: 'vendor/no-price', pricing: {} },
      ],
    });
    assert.deepEqual(
      result.map((m) => m.id),
      ['vendor/cad'],
    );
    assert.equal(result[0].inputPrice * 1000000, 1);
    assert.deepEqual(parseOpenRouterCatalog({ data: null }), []);
  });
  it('bounds automatic paid build loops and resets on a new user instruction', () => {
    const user = { role: 'user', parts: [{ type: 'text' }] };
    const build = {
      role: 'assistant',
      parts: [{ type: 'tool-build_parametric_model' }],
    };
    assert.equal(withinAutomaticBuildLimit([user, build, build]), true);
    assert.equal(withinAutomaticBuildLimit([user, build, build, build]), false);
    assert.equal(
      withinAutomaticBuildLimit([user, build, build, build, user]),
      true,
    );
    assert.equal(
      localConversationTitle('  Soporte\npara ducto  '),
      'Soporte para ducto',
    );
    assert.equal(localConversationTitle('x'.repeat(200)).length, 80);
  });
});
