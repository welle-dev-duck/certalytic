import { roundWeights, scoreWeights, varianceThreshold } from '../../config/env';

type ScoreComponent = {
  score?: number | null;
  confidence_band?: string;
};

const COMPONENT_WEIGHT_KEYS = {
  s_cv: 'cv',
  s_int: 'interview',
  s_cross: 'crossSource',
  s_id: 'identity',
} as const;

export class IntegrityScoreCalculator {
  scoreComponentsFromEvaluation(
    evaluation: Record<string, unknown>,
  ): Record<string, ScoreComponent> {
    const components: Record<string, ScoreComponent> = {};

    for (const key of Object.keys(COMPONENT_WEIGHT_KEYS)) {
      const component = evaluation[key];
      components[key] =
        component && typeof component === 'object'
          ? (component as ScoreComponent)
          : { score: 0 };
    }

    return components;
  }

  calculate(components: Record<string, ScoreComponent>): number {
    const weights = scoreWeights;
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [componentKey, weightKey] of Object.entries(
      COMPONENT_WEIGHT_KEYS,
    )) {
      const component = components[componentKey];

      if (!this.componentIncludedInScore(component)) {
        continue;
      }

      weightedSum +=
        this.componentScore(component) *
        weights[weightKey as keyof typeof weights];
      totalWeight += weights[weightKey as keyof typeof weights];
    }

    if (totalWeight <= 0) {
      return 0;
    }

    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }

  componentIncludedInScore(component: ScoreComponent | undefined): boolean {
    if (!component) {
      return false;
    }

    if (component.confidence_band === 'not-evaluated') {
      return false;
    }

    if ('score' in component && component.score === null) {
      return false;
    }

    return typeof component.score === 'number' && !Number.isNaN(component.score);
  }

  rollingInterviewScore(roundScores: Record<number, number>): number {
    const entries = Object.entries(roundScores);

    if (entries.length === 0) {
      return 0;
    }

    if (entries.length === 1) {
      return Math.round(entries[0]![1] * 100) / 100;
    }

    const weights = roundWeights;
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [roundNumber, score] of entries) {
      const weight = weights[Number(roundNumber) as keyof typeof weights] ?? 0;
      weightedSum += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 100) / 100
      : Math.round(entries[0]![1] * 100) / 100;
  }

  varianceDelta(previousScore: number, currentScore: number): number {
    return Math.round(Math.abs(previousScore - currentScore) * 100) / 100;
  }

  hasHighInconsistency(varianceDelta: number): boolean {
    return varianceDelta > varianceThreshold;
  }

  private componentScore(component: ScoreComponent): number {
    if (typeof component.score !== 'number' || Number.isNaN(component.score)) {
      return 0;
    }

    return component.score;
  }
}
