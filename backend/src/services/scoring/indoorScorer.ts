import { SCORING_WEIGHTS, THRESHOLDS } from '../../constants/constants';
import { ScoreDetail, ScoringContext, ScoringDayInput } from '../../types/types';
import { BaseScorer, createFactor } from './base';

export class IndoorScorer extends BaseScorer {
  readonly activity = 'Indoor sightseeing' as const;

  scoreDay(day: ScoringDayInput, _context: ScoringContext): ScoreDetail {
    const rainScore =
      day.precipitationProbabilityPct >= 70 ? 100 :
      day.precipitationProbabilityPct >= 45 ? 90 :
      day.precipitationProbabilityPct >= 25 ? 75 :
      day.precipitationProbabilityPct >= 10 ? 60 :
      50;

    const tempScore =
      day.tempCMax >= THRESHOLDS.INDOOR_SIGHTSEEING.COMFORT_TEMP_MIN_C && day.tempCMax <= THRESHOLDS.INDOOR_SIGHTSEEING.COMFORT_TEMP_MAX_C ? 100 :
      day.tempCMax >= 10 && day.tempCMax <= 32 ? 80 :
      55;

    const windScore =
      day.windSpeedMps <= 5 ? 95 :
      day.windSpeedMps <= 10 ? 80 :
      day.windSpeedMps <= 15 ? 65 :
      45;

    const humidity = day.humidityPct ?? 50;
    const humidityScore =
      humidity >= THRESHOLDS.INDOOR_SIGHTSEEING.COMFORT_HUMIDITY_MIN && humidity <= THRESHOLDS.INDOOR_SIGHTSEEING.COMFORT_HUMIDITY_MAX ? 95 :
      humidity >= 20 && humidity <= 80 ? 75 :
      55;
    const windSpeedKmh = Number((day.windSpeedMps * 3.6).toFixed(1));

    const factors = [
      createFactor('Rain probability (%)', day.precipitationProbabilityPct, SCORING_WEIGHTS.INDOOR_SIGHTSEEING.RAIN, rainScore),
      createFactor('Temperature (C)', day.tempCMax, SCORING_WEIGHTS.INDOOR_SIGHTSEEING.TEMPERATURE, tempScore),
      createFactor('Wind (km/h)', windSpeedKmh, SCORING_WEIGHTS.INDOOR_SIGHTSEEING.WIND, windScore),
      createFactor('Humidity (%)', humidity, SCORING_WEIGHTS.INDOOR_SIGHTSEEING.HUMIDITY, humidityScore)
    ];

    const reasons: string[] = [];
    if (rainScore >= 90) reasons.push('Wet weather favors indoor activities.');
    if (tempScore < 65) reasons.push('Transport comfort may be reduced by temperature extremes.');
    if (reasons.length === 0) reasons.push('Indoor attractions remain accessible and comfortable.');

    return this.buildScore(factors, reasons);
  }
}

export const indoorScorer = new IndoorScorer();
