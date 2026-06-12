import { describe, expect, it } from 'vitest';

import { env, scoreWeights } from './env';

describe('env config', () => {
  it('matches legacy screening score weights', () => {
    expect(scoreWeights).toEqual({
      cv: 0.25,
      interview: 0.5,
      crossSource: 0.15,
      identity: 0.1,
    });
  });

  it('exposes queue names from env', () => {
    expect(env.CERTALYTIC_QUEUE).toBeTruthy();
    expect(env.CERTALYTIC_PRIORITY_QUEUE).toBeTruthy();
  });
});
