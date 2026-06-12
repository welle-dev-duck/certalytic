import { productConfig } from '../../config/product';

export type ProcessedTranscript = {
  text: string;
  wasTruncated: boolean;
  wordCount: number;
};

function countWords(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

export class TranscriptProcessor {
  process(transcript: string): ProcessedTranscript {
    const wordCount = countWords(transcript);
    const cap = productConfig.transcript.hardCapCharacters;

    if (transcript.length <= cap) {
      return {
        text: transcript,
        wasTruncated: false,
        wordCount,
      };
    }

    return {
      text: this.smartTruncate(transcript, cap),
      wasTruncated: true,
      wordCount,
    };
  }

  private smartTruncate(transcript: string, cap: number): string {
    const lines = transcript.split(/\r?\n/u);
    const segments: string[] = [];

    if (lines.length > 0) {
      segments.push(lines.shift()!);
    }

    for (const line of lines) {
      const trimmed = line.trim();

      if (/^(interviewer|q:|question)/i.test(trimmed)) {
        segments.push(line);
      } else if (/^(candidate|a:|answer)/i.test(trimmed)) {
        segments.push(line);
      }
    }

    if (lines.length > 0) {
      segments.push(lines.at(-1)!);
    }

    let result = segments.filter(Boolean).join('\n');

    if (result.length > cap) {
      result = result.slice(0, cap);
    }

    return result;
  }
}
