import { productConfig } from '../../config/product';
import { MistralClient } from '../mistral/mistral.client';
import { buildCandidateEvaluationSystemPrompt } from './prompts/candidate-evaluation.prompt';
import {
  roleContextToPromptArray,
  type RoleContext,
} from './role-context';

export type RoundPayload = {
  round_number: number;
  transcript: string;
  interviewer_notes?: string | null;
  was_truncated: boolean;
};

export type PublicProfiles = {
  linkedin_url?: string | null;
  github_username?: string | null;
  linkedin_text?: string | null;
  github_text?: string | null;
};

export type ScreeningEvaluation = Record<string, unknown>;

export class CandidateEvaluator {
  constructor(private readonly mistralClient: MistralClient) {}

  async evaluate(
    cvText: string,
    rounds: RoundPayload[],
    publicProfiles: PublicProfiles,
    includeCrossSource: boolean,
    roleContext: RoleContext,
  ): Promise<ScreeningEvaluation> {
    const response = await this.mistralClient.chat({
      model: productConfig.mistral.chatModel,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: buildCandidateEvaluationSystemPrompt(roleContext),
        },
        {
          role: 'user',
          content: JSON.stringify({
            role_context: roleContextToPromptArray(roleContext),
            cv_text: cvText,
            merged_transcript: rounds[0]?.transcript ?? '',
            interviewer_notes: rounds[0]?.interviewer_notes ?? null,
            was_truncated: Boolean(rounds[0]?.was_truncated),
            public_profiles: publicProfiles,
            include_cross_source: includeCrossSource,
          }),
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Mistral returned an empty evaluation response.');
    }

    const decoded = JSON.parse(content) as Record<string, unknown>;

    return this.normalizeEvaluation(decoded, includeCrossSource);
  }

  private normalizeEvaluation(
    decoded: Record<string, unknown>,
    includeCrossSource: boolean,
  ): ScreeningEvaluation {
    return {
      s_cv: this.normalizeComponent(decoded.s_cv, 50),
      s_int: this.normalizeComponent(decoded.s_int, 50),
      s_cross: includeCrossSource
        ? this.normalizeComponent(decoded.s_cross, 50)
        : {
            score: null,
            summary:
              'No LinkedIn or GitHub profiles were submitted, so platform cross-reference was not performed.',
            indicators: [
              'Platform checks skipped - insufficient external profile data.',
            ],
            confidence_band: 'not-evaluated',
          },
      s_id: this.normalizeComponent(decoded.s_id, 50),
      follow_up_suggested: this.stringList(decoded.follow_up_suggested),
      anomalies: this.stringList(decoded.anomalies),
      round_analyses: this.normalizeRoundAnalyses(decoded.round_analyses),
      flags: this.normalizeFlags(decoded.flags),
      platform_matrix: this.normalizePlatformMatrix(
        decoded.platform_matrix,
        includeCrossSource,
      ),
      behaviour_analysis: this.normalizeSupplementaryAnalysis(
        decoded.behaviour_analysis,
        false,
      ),
      personality_analysis: this.normalizeSupplementaryAnalysis(
        decoded.personality_analysis,
        true,
      ),
    };
  }

  private normalizeSupplementaryAnalysis(
    analysis: unknown,
    personality: boolean,
  ): Record<string, unknown> {
    if (!analysis || typeof analysis !== 'object') {
      return {
        summary: 'Supplementary analysis was not available for this screening.',
        traits: [],
        detail_label: personality ? 'Work style' : 'Communication style',
        detail: 'Not assessed.',
        indicators: [],
        motivation_signals: [],
        concerns: [],
      };
    }

    const record = analysis as Record<string, unknown>;
    const detailKey = personality ? 'work_style' : 'communication_style';
    const indicatorKey = personality
      ? 'culture_fit_indicators'
      : 'collaboration_indicators';

    return {
      summary:
        typeof record.summary === 'string'
          ? record.summary
          : 'No supplementary summary provided.',
      traits: this.stringList(record.traits),
      detail_label: personality ? 'Work style' : 'Communication style',
      detail:
        typeof record[detailKey] === 'string' ? record[detailKey] : 'Not assessed.',
      indicators: this.stringList(record[indicatorKey]),
      motivation_signals: personality
        ? this.stringList(record.motivation_signals)
        : [],
      concerns: this.stringList(record.concerns),
    };
  }

  private stringList(values: unknown): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    return values.filter(
      (value): value is string => typeof value === 'string' && value !== '',
    );
  }

  private normalizeRoundAnalyses(value: unknown): Array<Record<string, unknown>> {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((round): round is Record<string, unknown> => typeof round === 'object')
      .map((round) => ({
        round_number: Number(round.round_number ?? 0),
        s_int: Math.max(0, Math.min(100, Number(round.s_int ?? 50))),
        s_id: Math.max(0, Math.min(100, Number(round.s_id ?? 50))),
        observations: this.stringList(round.observations),
        anomalies: this.stringList(round.anomalies),
        deep_dive_prompts: this.stringList(round.deep_dive_prompts),
      }));
  }

  private normalizeFlags(value: unknown): Array<Record<string, unknown>> {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter(
        (flag): flag is Record<string, unknown> =>
          typeof flag === 'object' && typeof flag.description === 'string',
      )
      .map((flag) => ({
        type: typeof flag.type === 'string' ? flag.type : 'interview_prompt',
        severity: typeof flag.severity === 'string' ? flag.severity : 'warning',
        description: flag.description,
        confidence:
          typeof flag.confidence === 'number'
            ? Math.max(0, Math.min(1, flag.confidence))
            : 0.75,
      }));
  }

  private normalizePlatformMatrix(
    value: unknown,
    includeCrossSource: boolean,
  ): Record<string, { score: number | null; explanation: string }> {
    if (!includeCrossSource) {
      return {
        linkedin_cv_match: {
          score: null,
          explanation:
            'No LinkedIn or GitHub profiles were submitted, so platform cross-reference was not performed.',
        },
        github_experience_match: {
          score: null,
          explanation: 'No GitHub profile was submitted.',
        },
        cross_platform_consistency: {
          score: null,
          explanation:
            'Cross-platform consistency requires external profile URLs.',
        },
      };
    }

    const matrix =
      value && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : {};

    return {
      linkedin_cv_match: this.normalizeMatrixRow(matrix.linkedin_cv_match),
      github_experience_match: this.normalizeMatrixRow(
        matrix.github_experience_match,
      ),
      cross_platform_consistency: this.normalizeMatrixRow(
        matrix.cross_platform_consistency,
      ),
    };
  }

  private normalizeMatrixRow(
    row: unknown,
  ): { score: number | null; explanation: string } {
    if (!row || typeof row !== 'object') {
      return { score: null, explanation: 'Not evaluated.' };
    }

    const record = row as Record<string, unknown>;
    const score = record.score;

    return {
      score:
        typeof score === 'number'
          ? Math.max(0, Math.min(100, Math.round(score)))
          : null,
      explanation:
        typeof record.explanation === 'string'
          ? record.explanation
          : 'No explanation provided.',
    };
  }

  private normalizeComponent(
    value: unknown,
    defaultScore: number,
  ): Record<string, unknown> {
    const component =
      value && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : {};
    const score =
      typeof component.score === 'number' ? component.score : defaultScore;
    const indicators = this.stringList(component.indicators);

    return {
      score: Math.max(0, Math.min(100, score)),
      summary:
        typeof component.summary === 'string'
          ? component.summary
          : 'No summary provided.',
      indicators:
        indicators.length > 0
          ? indicators
          : ['Signal density within expected range for role level.'],
      confidence_band:
        typeof component.confidence_band === 'string'
          ? component.confidence_band
          : score >= 70
            ? 'moderate-high'
            : 'moderate',
    };
  }
}
