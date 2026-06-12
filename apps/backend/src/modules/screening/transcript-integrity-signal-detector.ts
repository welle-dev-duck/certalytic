export type IntegrityFlag = {
  type: string;
  severity: string;
  description: string;
  confidence: number;
};

export class TranscriptIntegritySignalDetector {
  detect(transcript: string): IntegrityFlag[] {
    const trimmed = transcript.trim();

    if (trimmed === '') {
      return [];
    }

    const flags: IntegrityFlag[] = [];
    const pauseMatches = trimmed.match(/\[(?:long |extended )?pause[^\]]*\]/gi);
    const pauseCount = pauseMatches?.length ?? 0;
    const hasKeyboardCue = /\b(?:keyboard|typing|clicking)\b/i.test(trimmed);
    const hasFormalPivot =
      /\bcertainly!\b/i.test(trimmed) &&
      /\b(?:number one:|first, one must|to debug this, you can utilize)\b/i.test(
        trimmed,
      );

    if (pauseCount >= 2 || (pauseCount >= 1 && hasKeyboardCue)) {
      flags.push({
        type: 'interview_prompt',
        severity:
          pauseCount >= 3 || hasKeyboardCue ? 'critical' : 'warning',
        description: `Transcript documents ${pauseCount} latency pause(s)${
          hasKeyboardCue ? ' with audible keyboard activity' : ''
        } before structured answers, which may indicate live prompt assistance.`,
        confidence: hasKeyboardCue ? 0.94 : 0.88,
      });
    }

    if (hasFormalPivot) {
      flags.push({
        type: 'interview_prompt',
        severity: 'warning',
        description:
          'Candidate shifts from hesitant spontaneous phrasing into formal, textbook-style numbered technical prose after pauses.',
        confidence: 0.9,
      });
    }

    return this.deduplicateFlags(flags);
  }

  private deduplicateFlags(flags: IntegrityFlag[]): IntegrityFlag[] {
    const seen = new Set<string>();

    return flags.filter((flag) => {
      const key = `${flag.type}|${flag.description}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }
}
