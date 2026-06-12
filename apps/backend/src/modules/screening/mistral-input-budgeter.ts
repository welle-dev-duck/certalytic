import { productConfig } from '../../config/product';
import { TranscriptProcessor } from './transcript-processor';

export type BudgetedInput = {
  cvText: string;
  transcriptText: string;
  cvTruncated: boolean;
  transcriptTruncated: boolean;
};

export class MistralInputBudgeter {
  constructor(private readonly transcriptProcessor: TranscriptProcessor) {}

  budget(cvText: string, transcriptText: string): BudgetedInput {
    const { limits } = productConfig;
    const maxCharacters =
      limits.mistralMaxInputTokens * limits.charsPerTokenEstimate;
    const cvLength = cvText.length;
    const transcriptLength = transcriptText.length;
    const totalLength = cvLength + transcriptLength;

    if (totalLength <= maxCharacters) {
      return {
        cvText,
        transcriptText,
        cvTruncated: false,
        transcriptTruncated: false,
      };
    }

    const cvShare = cvLength / Math.max(1, totalLength);
    const cvBudget = Math.floor(maxCharacters * cvShare);
    const transcriptBudget = Math.max(1, maxCharacters - cvBudget);
    const cvTruncated = cvLength > cvBudget;
    const transcriptTruncated = transcriptLength > transcriptBudget;
    const budgetedCv = cvTruncated ? cvText.slice(0, cvBudget) : cvText;
    const processedTranscript = this.transcriptProcessor.process(
      transcriptTruncated
        ? transcriptText.slice(0, transcriptBudget)
        : transcriptText,
    );

    return {
      cvText: budgetedCv,
      transcriptText: processedTranscript.text,
      cvTruncated,
      transcriptTruncated:
        transcriptTruncated || processedTranscript.wasTruncated,
    };
  }
}
