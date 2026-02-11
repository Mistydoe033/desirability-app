import { SCORING_WEIGHTS, THRESHOLDS } from '../../constants/constants';
import { ScoreDetail, ScoringContext, ScoringDayInput } from '../../types/types';
import { BaseScorer, createFactor } from './base';

export class OutdoorSightseeingScorer extends BaseScorer {
  readonly activity = 'Outdoor sightseeing' as const;

  scoreDay(day: ScoringDayInput, _context: ScoringContext): ScoreDetail {
    const tempScore =
      day.tempCMax >= THRESHOLDS.OUTDOOR_SIGHTSEEING.OPTIMAL_TEMP_MIN_C && day.tempCMax <= THRESHOLDS.OUTDOOR_SIGHTSEEING.OPTIMAL_TEMP_MAX_C ? 100 :
      day.tempCMax >= 8 && day.tempCMax <= 28 ? 80 :
      day.tempCMax >= 2 && day.tempCMax <= 33 ? 55 :
      25;

    const rainScore =
      day.precipitationProbabilityPct <= 10 ? 100 :
      day.precipitationProbabilityPct <= 30 ? 85 :
      day.precipitationProbabilityPct <= 50 ? 60 :
      day.precipitationProbabilityPct <= 75 ? 35 :
      15;

    const visibilityScore =
      (day.visibilityKm ?? 0) >= 12 ? 100 :
      (day.visibilityKm ?? 0) >= THRESHOLDS.OUTDOOR_SIGHTSEEING.MIN_VISIBILITY_KM ? 80 :
      (day.visibilityKm ?? 0) >= 3 ? 55 :
      25;

    const windScore =
      day.windSpeedMps <= 4 ? 100 :
      day.windSpeedMps <= THRESHOLDS.OUTDOOR_SIGHTSEEING.MAX_WIND_MPS ? 75 :
      day.windSpeedMps <= 16 ? 45 :
      20;

    const uvScore =
      (day.uvIndex ?? 0) <= 6 ? 90 :
      (day.uvIndex ?? 0) <= THRESHOLDS.OUTDOOR_SIGHTSEEING.MAX_UV_INDEX ? 70 :
      45;
    const windSpeedKmh = Number((day.windSpeedMps * 3.6).toFixed(1));

    const factors = [
      createFactor('Temperature (C)', day.tempCMax, SCORING_WEIGHTS.OUTDOOR_SIGHTSEEING.TEMPERATURE, tempScore),
      createFactor('Rain probability (%)', day.precipitationProbabilityPct, SCORING_WEIGHTS.OUTDOOR_SIGHTSEEING.RAIN, rainScore),
      createFactor('Visibility (km)', day.visibilityKm ?? 0, SCORING_WEIGHTS.OUTDOOR_SIGHTSEEING.VISIBILITY, visibilityScore),
      createFactor('Wind (km/h)', windSpeedKmh, SCORING_WEIGHTS.OUTDOOR_SIGHTSEEING.WIND, windScore),
      createFactor('UV index', day.uvIndex ?? 0, SCORING_WEIGHTS.OUTDOOR_SIGHTSEEING.UV, uvScore)
    ];

    const reasons: string[] = [];
    if (rainScore < 50) reasons.push('Rain risk is high for trails.');
    if (visibilityScore < 50) reasons.push('Reduced visibility impacts scenic routes.');
    if (windScore < 45) reasons.push('Wind exposure is likely uncomfortable.');
    if (reasons.length === 0) reasons.push('Conditions are well suited for outdoor sightseeing.');

    return this.buildScore(factors, reasons);
  }
}

export const outdoorSightseeingScorer = new OutdoorSightseeingScorer();
