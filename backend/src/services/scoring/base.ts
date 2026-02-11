import {
  ActivityName,
  ActivityScoreResult,
  DailyScore,
  Factor,
  ScoreDetail,
  ScoreRating,
  ScoringContext,
  ScoringDayInput
} from '../../types/types';
import { SCORE_RATINGS } from '../../constants/constants';

function clampScore(score: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  if (score < 0) {
    return 0;
  }

  if (score > 100) {
    return 100;
  }

  return Math.round(score * 10) / 10;
}

function ratingFromScore(score: number): ScoreRating {
  if (score >= SCORE_RATINGS.EXCELLENT_MIN) return 'Excellent';
  if (score >= SCORE_RATINGS.GOOD_MIN) return 'Good';
  if (score >= SCORE_RATINGS.FAIR_MIN) return 'Fair';
  if (score >= SCORE_RATINGS.POOR_MIN) return 'Poor';
  return 'Not Suitable';
}

function impactFromScore(score: number): 'positive' | 'neutral' | 'negative' {
  if (score >= 75) return 'positive';
  if (score >= 45) return 'neutral';
  return 'negative';
}

function aggregateFactorValue(values: Array<string | number>): string | number {
  const numeric = values.filter((value): value is number => typeof value === 'number');
  if (numeric.length === values.length && numeric.length > 0) {
    const avg = numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
    return Math.round(avg * 10) / 10;
  }

  return 'varied';
}

export function createFactor(name: string, value: string | number, weight: number, score0to100: number): Factor {
  const normalizedScore = clampScore(score0to100);
  return {
    name,
    value,
    weight,
    score0to100: normalizedScore,
    impact: impactFromScore(normalizedScore)
  };
}

export function weightedScore(factors: Factor[]): number {
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  if (totalWeight <= 0) {
    return 0;
  }

  const weightedSum = factors.reduce((sum, factor) => sum + factor.weight * factor.score0to100, 0);
  return clampScore(weightedSum / totalWeight);
}

export abstract class BaseScorer {
  abstract readonly activity: ActivityName;

  abstract scoreDay(day: ScoringDayInput, context: ScoringContext): ScoreDetail;

  scoreWeek(days: ScoringDayInput[], context: ScoringContext): ActivityScoreResult {
    const dayScores: DailyScore[] = days.map((day) => ({
      date: day.date,
      detail: this.scoreDay(day, context)
    }));

    const weeklyScore =
      dayScores.reduce((sum, item) => sum + item.detail.score0to100, 0) /
      Math.max(1, dayScores.length);

    const weeklyFactorsMap = new Map<string, Factor[]>();
    dayScores.forEach((item) => {
      item.detail.factors.forEach((factor) => {
        const existing = weeklyFactorsMap.get(factor.name) ?? [];
        existing.push(factor);
        weeklyFactorsMap.set(factor.name, existing);
      });
    });

    const weeklyFactors: Factor[] = Array.from(weeklyFactorsMap.entries()).map(([name, factors]) => {
      const score0to100 =
        factors.reduce((sum, factor) => sum + factor.score0to100, 0) /
        Math.max(1, factors.length);

      return createFactor(
        name,
        aggregateFactorValue(factors.map((factor) => factor.value)),
        factors[0].weight,
        score0to100
      );
    });

    const bestDay = dayScores.reduce((best, current) =>
      current.detail.score0to100 > best.detail.score0to100 ? current : best
    );

    const worstDay = dayScores.reduce((worst, current) =>
      current.detail.score0to100 < worst.detail.score0to100 ? current : worst
    );

    const weekScore = clampScore(weeklyScore);

    return {
      activity: this.activity,
      dayScores,
      week: {
        score0to100: weekScore,
        rating: ratingFromScore(weekScore),
        factors: weeklyFactors,
        reasons: [
          `Best day: ${bestDay.date} (${bestDay.detail.score0to100.toFixed(1)})`,
          `Worst day: ${worstDay.date} (${worstDay.detail.score0to100.toFixed(1)})`
        ]
      }
    };
  }

  protected buildScore(factors: Factor[], reasons: string[]): ScoreDetail {
    const score0to100 = weightedScore(factors);
    return {
      score0to100,
      rating: ratingFromScore(score0to100),
      factors,
      reasons
    };
  }

  protected clamp(value: number): number {
    return clampScore(value);
  }
}
