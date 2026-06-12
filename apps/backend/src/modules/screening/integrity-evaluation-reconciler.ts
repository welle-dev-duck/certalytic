import type {
  EvaluationFlag,
  RoundAnalysis,
  ScoreComponent,
  ScreeningEvaluation,
} from './dtos/screening-evaluation.dto';

export class IntegrityEvaluationReconciler {
  reconcile(
    evaluation: ScreeningEvaluation,
    hasExternalProfiles: boolean,
  ): ScreeningEvaluation {
    const flags = this.normalizeFlags(evaluation.flags, hasExternalProfiles);
    const [sIntCap, sCvCap] = this.scoreCapsFromFlags(flags);

    return {
      ...evaluation,
      flags,
      s_int: this.capComponent(evaluation.s_int, sIntCap, 'Interview authenticity signals were adjusted to align with raised integrity flags.'),
      s_cv: this.capComponent(evaluation.s_cv, sCvCap, 'CV authenticity signals were adjusted to align with raised integrity flags.'),
      round_analyses: this.reconcileRoundAnalyses(
        evaluation.round_analyses,
        flags,
        sIntCap,
      ),
    };
  }

  private normalizeFlags(
    flags: EvaluationFlag[],
    hasExternalProfiles: boolean,
  ): EvaluationFlag[] {
    const normalized: EvaluationFlag[] = [];

    for (const flag of flags) {
      let type = flag.type;
      let severity = flag.severity;
      const description = flag.description;

      if (type === 'platform_mismatch' && !hasExternalProfiles) {
        type = 'insufficient_signal';
        severity = 'info';
      }

      if (type === 'ai_text' && this.flagTargetsInterview(description)) {
        type = 'interview_prompt';
      }

      normalized.push({
        type,
        severity,
        description,
        confidence: flag.confidence,
      });
    }

    return normalized;
  }

  private scoreCapsFromFlags(flags: EvaluationFlag[]): [number, number] {
    let sIntCap = 100;
    let sCvCap = 100;

    for (const flag of flags) {
      const type = flag.type;
      const severity = flag.severity;
      const description = flag.description;

      if (type === 'interview_prompt') {
        sIntCap = Math.min(sIntCap, severity === 'critical' ? 40 : 55);
      }

      if (type === 'ai_text' && !this.flagTargetsInterview(description)) {
        sCvCap = Math.min(sCvCap, severity === 'critical' ? 50 : 65);
      }

      if (type === 'synthetic_profile' && severity !== 'info') {
        sIntCap = Math.min(sIntCap, 60);
      }
    }

    return [sIntCap, sCvCap];
  }

  private capComponent(
    component: ScoreComponent,
    cap: number,
    adjustmentSummary: string,
  ): ScoreComponent {
    const score = Number(component.score ?? 50);

    if (score <= cap) {
      return component;
    }

    const summary =
      component.summary !== ''
        ? `${adjustmentSummary} ${component.summary}`
        : adjustmentSummary;

    return {
      ...component,
      score: Math.round(cap * 100) / 100,
      summary,
    };
  }

  private reconcileRoundAnalyses(
    roundAnalyses: RoundAnalysis[],
    flags: EvaluationFlag[],
    sIntCap: number,
  ): RoundAnalysis[] {
    const interviewFlagDescriptions = flags
      .filter(
        (flag) =>
          ['interview_prompt', 'ai_text'].includes(flag.type) &&
          flag.severity !== 'info',
      )
      .map((flag) => flag.description);

    return roundAnalyses.map((round) => {
      let sInt = round.s_int;

      if (sInt > sIntCap) {
        sInt = Math.round(sIntCap * 100) / 100;
      }

      const observations = [...round.observations];
      const anomalies = [...round.anomalies];

      for (const description of interviewFlagDescriptions) {
        if (!anomalies.includes(description)) {
          anomalies.push(description);
        }
      }

      if (sInt <= 55 && interviewFlagDescriptions.length > 0) {
        for (const description of interviewFlagDescriptions) {
          if (!observations.includes(description)) {
            observations.push(description);
          }
        }
      }

      return {
        ...round,
        s_int: sInt,
        observations: observations.filter(Boolean),
        anomalies: anomalies.filter(Boolean),
      };
    });
  }

  private flagTargetsInterview(description: string): boolean {
    const haystack = description.toLowerCase();

    for (const needle of [
      'interview',
      'linguistic',
      'conversational',
      'latency',
      'rehears',
      'synthetic response',
      'live prompt',
      'monologue',
    ]) {
      if (haystack.includes(needle)) {
        return true;
      }
    }

    return false;
  }
}
