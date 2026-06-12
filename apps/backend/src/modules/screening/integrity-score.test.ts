import { describe, expect, it } from 'vitest';

import { IntegrityScoreCalculator } from './integrity-score';
import { TranscriptProcessor } from './transcript-processor';

describe('IntegrityScoreCalculator', () => {
  const calculator = new IntegrityScoreCalculator();

  it('returns the same score for a single interview round', () => {
    expect(calculator.rollingInterviewScore({ 1: 75 })).toBe(75);
  });

  it('uses configured weights for multiple interview rounds', () => {
    expect(
      calculator.rollingInterviewScore({
        1: 80,
        2: 60,
        3: 70,
      }),
    ).toBe(69);
  });

  it('renormalizes when cross-source is skipped', () => {
    const withCrossSource = {
      s_cv: { score: 80 },
      s_int: { score: 70 },
      s_cross: { score: 60 },
      s_id: { score: 90 },
    };
    const withoutCrossSource = {
      s_cv: { score: 80 },
      s_int: { score: 70 },
      s_cross: {
        score: null,
        confidence_band: 'not-evaluated',
        summary: 'Skipped.',
      },
      s_id: { score: 90 },
    };

    expect(calculator.calculate(withCrossSource)).toBe(73);
    expect(calculator.calculate(withoutCrossSource)).toBe(75.29);
  });
});

describe('TranscriptProcessor', () => {
  it('does not truncate short transcripts', () => {
    const processor = new TranscriptProcessor();
    const text = 'Interviewer: Hello\nCandidate: Hi there friend.';
    const result = processor.process(text);

    expect(result.wasTruncated).toBe(false);
    expect(result.text).toBe(text);
  });
});
