import { describe, expect, it } from 'vitest';

import { CaptionFileParser } from './caption-file-parser';

describe('CaptionFileParser', () => {
  const parser = new CaptionFileParser();

  it('parses vtt caption files into plain transcript text', async () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
Interviewer: Tell me about your experience.

00:00:05.000 --> 00:00:08.000
Candidate: I built distributed systems.`;

    const text = await parser.parseContents(vtt, 'vtt');

    expect(text).toContain('Interviewer: Tell me about your experience.');
    expect(text).toContain('Candidate: I built distributed systems.');
  });
});
