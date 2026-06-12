import { describe, expect, it } from 'vitest';

import { normalizeMistralServerUrl } from './mistral.client';

describe('normalizeMistralServerUrl', () => {
  it('strips a trailing /v1 segment', () => {
    expect(normalizeMistralServerUrl('https://api.mistral.ai/v1')).toBe(
      'https://api.mistral.ai',
    );
    expect(normalizeMistralServerUrl('https://api.mistral.ai/v1/')).toBe(
      'https://api.mistral.ai',
    );
  });

  it('leaves bare host URLs unchanged', () => {
    expect(normalizeMistralServerUrl('https://api.mistral.ai')).toBe(
      'https://api.mistral.ai',
    );
  });
});
