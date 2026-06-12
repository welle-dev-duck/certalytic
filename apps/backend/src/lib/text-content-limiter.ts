import { limits } from '../config/env';

export type LimitedText = {
  text: string;
  wasTruncated: boolean;
  wordCount: number;
};

function countWords(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

function truncateToWordCount(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/u).filter(Boolean);

  if (words.length <= maxWords) {
    return text;
  }

  return words.slice(0, maxWords).join(' ');
}

function limitText(
  text: string,
  maxWords: number,
  maxCharacters: number,
): LimitedText {
  let result = text;
  let wasTruncated = false;

  if (countWords(result) > maxWords) {
    result = truncateToWordCount(result, maxWords);
    wasTruncated = true;
  }

  if (result.length > maxCharacters) {
    result = result.slice(0, maxCharacters);
    wasTruncated = true;
  }

  return {
    text: result,
    wasTruncated,
    wordCount: countWords(result),
  };
}

export function limitCvText(text: string): LimitedText {

  return limitText(text, limits.cvTextMaxWords, limits.cvTextMaxCharacters);
}

export function limitTranscriptText(text: string): LimitedText {

  return limitText(
    text,
    limits.transcriptTextMaxWords,
    limits.transcriptTextMaxCharacters,
  );
}
