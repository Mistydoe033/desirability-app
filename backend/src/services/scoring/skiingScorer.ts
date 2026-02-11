import { THRESHOLDS, SCORING_WEIGHTS } from '../../constants/constants';
import { ScoreDetail, ScoringContext, ScoringDayInput } from '../../types/types';
import { BaseScorer, createFactor } from './base';

export class SkiingScorer extends BaseScorer {
  readonly activity = 'Skiing' as const;

  scoreDay(day: ScoringDayInput, _context: ScoringContext): ScoreDetail {
    if ((day.elevationM ?? 0) < THRESHOLDS.SKIING.MIN_ELEVATION_M) {
      return this.buildScore(
        [
          createFactor('Elevation (m)', day.elevationM ?? 0, 1, 0)
        ],
        [`Elevation ${(day.elevationM ?? 0).toFixed(0)}m is below skiing threshold`]
      );
    }

    const windSpeedKmh = Number((day.windSpeedMps * 3.6).toFixed(1));
    if (day.snowDepthCm <= 0 && day.snowfallCm <= 0) {
      return this.buildScore(
        [
          createFactor('Snow depth (cm)', day.snowDepthCm, SCORING_WEIGHTS.SKIING.SNOW_DEPTH, 0),
          createFactor('New snow (cm)', day.snowfallCm, SCORING_WEIGHTS.SKIING.SNOWFALL, 0),
          createFactor('Temperature (C)', day.tempCMax, SCORING_WEIGHTS.SKIING.TEMPERATURE, 0),
          createFactor('Wind (km/h)', windSpeedKmh, SCORING_WEIGHTS.SKIING.WIND, 0)
        ],
        ['No snow base and no fresh snowfall; skiing is not viable.']
      );
    }

    const snowDepthScore =
      day.snowDepthCm >= 80 ? 100 :
      day.snowDepthCm >= 50 ? 90 :
      day.snowDepthCm >= THRESHOLDS.SKIING.MIN_SNOW_DEPTH_CM ? 65 :
      day.snowDepthCm >= 10 ? 35 :
      0;

    const snowfallScore =
      day.snowfallCm >= 10 ? 100 :
      day.snowfallCm >= 5 ? 85 :
      day.snowfallCm >= 2 ? 70 :
      day.snowfallCm > 0 ? 45 :
      20;

    const tempScore =
      day.tempCMax >= THRESHOLDS.SKIING.OPTIMAL_TEMP_MIN_C && day.tempCMax <= THRESHOLDS.SKIING.OPTIMAL_TEMP_MAX_C ? 100 :
      day.tempCMax >= -18 && day.tempCMax <= -2 ? 80 :
      day.tempCMax >= -22 && day.tempCMax <= 2 ? 55 :
      25;

    const windScore =
      day.windSpeedMps <= 4 ? 100 :
      day.windSpeedMps <= 8 ? 80 :
      day.windSpeedMps <= 12 ? 55 :
      20;

    const factors = [
      createFactor('Snow depth (cm)', day.snowDepthCm, SCORING_WEIGHTS.SKIING.SNOW_DEPTH, snowDepthScore),
      createFactor('New snow (cm)', day.snowfallCm, SCORING_WEIGHTS.SKIING.SNOWFALL, snowfallScore),
      createFactor('Temperature (C)', day.tempCMax, SCORING_WEIGHTS.SKIING.TEMPERATURE, tempScore),
      createFactor('Wind (km/h)', windSpeedKmh, SCORING_WEIGHTS.SKIING.WIND, windScore)
    ];

    const reasons: string[] = [];
    if (snowDepthScore < 40) reasons.push('Limited base snow depth.');
    if (snowfallScore >= 80) reasons.push('Fresh snowfall improves slope quality.');
    if (windScore < 40) reasons.push('Strong winds reduce lift comfort and safety.');
    if (reasons.length === 0) reasons.push('Balanced alpine conditions for skiing.');

    return this.buildScore(factors, reasons);
  }
}

export const skiingScorer = new SkiingScorer();
