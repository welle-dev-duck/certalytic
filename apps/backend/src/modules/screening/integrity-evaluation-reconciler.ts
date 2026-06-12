type Evaluation = Record<string, unknown>;
type Flag = Record<string, unknown>;
type Component = Record<string, unknown>;

export class IntegrityEvaluationReconciler {
  reconcile(evaluation: Evaluation, hasExternalProfiles: boolean): Evaluation {
    const flags = this.normalizeFlags(
      Array.isArray(evaluation.flags) ? (evaluation.flags as Flag[]) : [],
      hasExternalProfiles,
    );
    const [sIntCap, sCvCap] = this.scoreCapsFromFlags(flags);

    return {
      ...evaluation,
      flags,
      s_int: this.capComponent(
        (evaluation.s_int as Component) ?? {},
        sIntCap,
        'Interview authenticity signals were adjusted to align with raised integrity flags.',
      ),
      s_cv: this.capComponent(
        (evaluation.s_cv as Component) ?? {},
        sCvCap,
        'CV authenticity signals were adjusted to align with raised integrity flags.',
      ),
      round_analyses: this.reconcileRoundAnalyses(
        Array.isArray(evaluation.round_analyses)
          ? (evaluation.round_analyses as Flag[])
          : [],
        flags,
        sIntCap,
      ),
    };
  }

  private normalizeFlags(flags: Flag[], hasExternalProfiles: boolean): Flag[] {
    const normalized: Flag[] = [];

    for (const flag of flags) {
      if (typeof flag.description !== 'string') {
        continue;
      }

      let type = typeof flag.type === 'string' ? flag.type : 'interview_prompt';
      let severity =
        typeof flag.severity === 'string' ? flag.severity : 'warning';
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
        confidence:
          typeof flag.confidence === 'number'
            ? Math.max(0, Math.min(1, flag.confidence))
            : 0.75,
      });
    }

    return normalized;
  }

  private scoreCapsFromFlags(flags: Flag[]): [number, number] {
    let sIntCap = 100;
    let sCvCap = 100;

    for (const flag of flags) {
      const type = flag.type ?? '';
      const severity = flag.severity ?? 'warning';
      const description =
        typeof flag.description === 'string' ? flag.description : '';

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
    component: Component,
    cap: number,
    adjustmentSummary: string,
  ): Component {
    const score = Number(component.score ?? 50);

    if (score <= cap) {
      return component;
    }

    const summary =
      typeof component.summary === 'string' && component.summary !== ''
        ? `${adjustmentSummary} ${component.summary}`
        : adjustmentSummary;

    return {
      ...component,
      score: Math.round(cap * 100) / 100,
      summary,
    };
  }

  private reconcileRoundAnalyses(
    roundAnalyses: Flag[],
    flags: Flag[],
    sIntCap: number,
  ): Flag[] {
    const interviewFlagDescriptions = flags
      .filter(
        (flag) =>
          ['interview_prompt', 'ai_text'].includes(String(flag.type)) &&
          flag.severity !== 'info',
      )
      .map((flag) => flag.description)
      .filter((description): description is string => typeof description === 'string');

    return roundAnalyses
      .filter((round) => typeof round === 'object')
      .map((round) => {
        let sInt = Number(round.s_int ?? 50);

        if (sInt > sIntCap) {
          sInt = Math.round(sIntCap * 100) / 100;
        }

        const observations = Array.isArray(round.observations)
          ? [...(round.observations as string[])]
          : [];
        const anomalies = Array.isArray(round.anomalies)
          ? [...(round.anomalies as string[])]
          : [];

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
