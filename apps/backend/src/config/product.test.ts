import { describe, expect, it } from 'vitest';

import { productConfig } from './product';

describe('productConfig', () => {
  it('matches legacy screening score weights', () => {
    expect(productConfig.scoreWeights).toEqual({
      cv: 0.25,
      interview: 0.5,
      crossSource: 0.15,
      identity: 0.1,
    });
  });

  it('excludes transcription-specific limits', () => {
    expect(productConfig).not.toHaveProperty('transcriptionPack');
    expect(productConfig.queues).not.toHaveProperty('transcriptions');
  });
});
