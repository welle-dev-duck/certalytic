export class TranscriptMerger {
  merge(segments: string[]): string {
    const parts = segments
      .map((segment) => segment.trim())
      .filter((segment) => segment !== '');

    if (parts.length === 0) {
      return '';
    }

    if (parts.length === 1) {
      return parts[0]!;
    }

    return parts
      .map(
        (part, index) =>
          `--- Interview transcript ${index + 1} ---\n\n${part}`,
      )
      .join('\n\n');
  }
}
