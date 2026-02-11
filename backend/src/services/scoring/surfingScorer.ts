import { SCORING_WEIGHTS, THRESHOLDS } from '../../constants/constants';
import { ScoreDetail, ScoringContext, ScoringDayInput } from '../../types/types';
import { BaseScorer, createFactor } from './base';
import { angularDiffDeg, normalizeDeg, oppositeDeg } from './geo';

function scoreWindAlignment(windFromDeg: number, coastFaceDeg: number): {
  score: number;
  offshoreDiff: number;
  onshoreDiff: number;
} {
  const offshoreBearing = oppositeDeg(coastFaceDeg);
  const onshoreBearing = normalizeDeg(coastFaceDeg);

  const offshoreDiff = angularDiffDeg(windFromDeg, offshoreBearing);
  const onshoreDiff = angularDiffDeg(windFromDeg, onshoreBearing);

  let score =
    offshoreDiff <= 20 ? 100 :
    offshoreDiff <= 40 ? 85 :
    offshoreDiff <= 60 ? 70 :
    offshoreDiff <= 90 ? 50 :
    30;

  if (onshoreDiff <= 25) {
    score = Math.min(score, 20);
  }

  return { score, offshoreDiff, onshoreDiff };
}

function windSpeedPenalty(windSpeedMps: number): number {
  if (windSpeedMps <= 2) return 5;
  if (windSpeedMps <= 8) return 0;
  if (windSpeedMps <= 12) return 10;
  if (windSpeedMps <= 16) return 25;
  if (windSpeedMps <= 20) return 40;
  return 55;
}

export class SurfingScorer extends BaseScorer {
  readonly activity = 'Surfing' as const;

  scoreDay(day: ScoringDayInput, context: ScoringContext): ScoreDetail {
    if (context.coastFaceDeg === null) {
      const factors = [
        createFactor('Swell height (m)', Number((day.swellHeightM ?? day.waveHeightM ?? 0).toFixed(2)), SCORING_WEIGHTS.SURFING.SWELL_HEIGHT, 0),
        createFactor('Wave height (m)', Number((day.waveHeightM ?? day.swellHeightM ?? 0).toFixed(2)), SCORING_WEIGHTS.SURFING.WAVE_HEIGHT, 0),
        createFactor('Swell period (s)', Number((day.swellPeriodS ?? 0).toFixed(1)), SCORING_WEIGHTS.SURFING.SWELL_PERIOD, 0),
        createFactor('Wind quality (coast-relative)', 0, SCORING_WEIGHTS.SURFING.WIND_ALIGNMENT, 0),
        createFactor('Water temperature (C)', Number((day.seaSurfaceTempC ?? day.tempCMax).toFixed(1)), SCORING_WEIGHTS.SURFING.WATER_TEMPERATURE, 0)
      ];

      return this.buildScore(factors, [
        'No reliable coastline orientation for this location; surfing marked not suitable.'
      ]);
    }

    const marineUnavailable =
      (day.swellHeightM ?? 0) <= 0 &&
      (day.waveHeightM ?? 0) <= 0 &&
      (day.swellPeriodS ?? 0) <= 0;

    if (marineUnavailable) {
      const factors = [
        createFactor('Swell height (m)', Number((day.swellHeightM ?? day.waveHeightM ?? 0).toFixed(2)), SCORING_WEIGHTS.SURFING.SWELL_HEIGHT, 0),
        createFactor('Wave height (m)', Number((day.waveHeightM ?? day.swellHeightM ?? 0).toFixed(2)), SCORING_WEIGHTS.SURFING.WAVE_HEIGHT, 0),
        createFactor('Swell period (s)', Number((day.swellPeriodS ?? 0).toFixed(1)), SCORING_WEIGHTS.SURFING.SWELL_PERIOD, 0),
        createFactor('Wind quality (coast-relative)', 0, SCORING_WEIGHTS.SURFING.WIND_ALIGNMENT, 0),
        createFactor('Water temperature (C)', Number((day.seaSurfaceTempC ?? day.tempCMax).toFixed(1)), SCORING_WEIGHTS.SURFING.WATER_TEMPERATURE, 0)
      ];

      return this.buildScore(factors, [
        'No marine swell/wave data available for this location; surfing marked not suitable.'
      ]);
    }

    const swellHeight = day.swellHeightM ?? day.waveHeightM ?? 0;
    const waveHeight = day.waveHeightM ?? day.swellHeightM ?? 0;
    const swellPeriod = day.swellPeriodS ?? 0;
    const waterTemp = day.seaSurfaceTempC ?? day.tempCMax;
    const hasMinimumWaveEnergy = Math.max(swellHeight, waveHeight) >= 0.35;
    const hasMinimumPeriod = swellPeriod >= 5;

    if (!hasMinimumWaveEnergy || !hasMinimumPeriod) {
      const factors = [
        createFactor('Swell height (m)', Number(swellHeight.toFixed(2)), SCORING_WEIGHTS.SURFING.SWELL_HEIGHT, 0),
        createFactor('Wave height (m)', Number(waveHeight.toFixed(2)), SCORING_WEIGHTS.SURFING.WAVE_HEIGHT, 0),
        createFactor('Swell period (s)', Number(swellPeriod.toFixed(1)), SCORING_WEIGHTS.SURFING.SWELL_PERIOD, 0),
        createFactor('Wind quality (coast-relative)', 0, SCORING_WEIGHTS.SURFING.WIND_ALIGNMENT, 0),
        createFactor('Water temperature (C)', Number(waterTemp.toFixed(1)), SCORING_WEIGHTS.SURFING.WATER_TEMPERATURE, 0)
      ];

      const reasons: string[] = [];
      if (!hasMinimumWaveEnergy) {
        reasons.push('Wave/swell height is below minimum surfable energy.');
      }
      if (!hasMinimumPeriod) {
        reasons.push('Swell period is too short for surfable wave power.');
      }

      return this.buildScore(factors, reasons);
    }

    const swellHeightScore =
      swellHeight >= THRESHOLDS.SURFING.OPTIMAL_SWELL_HEIGHT_MIN_M && swellHeight <= THRESHOLDS.SURFING.OPTIMAL_SWELL_HEIGHT_MAX_M ? 100 :
      swellHeight >= 0.8 && swellHeight <= 3.5 ? 80 :
      swellHeight >= 0.4 && swellHeight <= 4.5 ? 55 :
      25;

    const swellPeriodScore =
      swellPeriod >= 12 ? 100 :
      swellPeriod >= THRESHOLDS.SURFING.OPTIMAL_SWELL_PERIOD_MIN_S ? 80 :
      swellPeriod >= 7 ? 60 :
      30;

    const waveHeightScore =
      waveHeight >= 0.9 && waveHeight <= 2.8 ? 100 :
      waveHeight >= 0.6 && waveHeight <= 3.5 ? 80 :
      waveHeight >= 0.35 && waveHeight <= 4.5 ? 55 :
      25;

    const waterTempScore =
      waterTemp >= THRESHOLDS.SURFING.OPTIMAL_WATER_TEMP_MIN_C && waterTemp <= THRESHOLDS.SURFING.OPTIMAL_WATER_TEMP_MAX_C ? 100 :
      waterTemp >= 12 && waterTemp <= 30 ? 75 :
      50;

    let windScore = 55;
    let windReason = 'Coast orientation unavailable; wind quality estimated conservatively.';

    if (context.coastFaceDeg !== null && day.windFromDeg !== null) {
      const alignment = scoreWindAlignment(day.windFromDeg, context.coastFaceDeg);
      const penalty = windSpeedPenalty(day.windSpeedMps);
      windScore = this.clamp(alignment.score - penalty);

      if (alignment.onshoreDiff <= 25) {
        windReason = `Onshore tendency (${alignment.onshoreDiff.toFixed(0)}° from coast-facing wind).`;
      } else if (alignment.offshoreDiff <= 35) {
        windReason = `Offshore-friendly wind (${alignment.offshoreDiff.toFixed(0)}° from offshore axis).`;
      } else {
        windReason = `Cross-shore wind (${alignment.offshoreDiff.toFixed(0)}° from offshore axis).`;
      }
    }

    const factors = [
      createFactor('Swell height (m)', Number(swellHeight.toFixed(2)), SCORING_WEIGHTS.SURFING.SWELL_HEIGHT, swellHeightScore),
      createFactor('Wave height (m)', Number(waveHeight.toFixed(2)), SCORING_WEIGHTS.SURFING.WAVE_HEIGHT, waveHeightScore),
      createFactor('Swell period (s)', Number(swellPeriod.toFixed(1)), SCORING_WEIGHTS.SURFING.SWELL_PERIOD, swellPeriodScore),
      createFactor('Wind quality (coast-relative)', Number(windScore.toFixed(1)), SCORING_WEIGHTS.SURFING.WIND_ALIGNMENT, windScore),
      createFactor('Water temperature (C)', Number(waterTemp.toFixed(1)), SCORING_WEIGHTS.SURFING.WATER_TEMPERATURE, waterTempScore)
    ];

    const reasons: string[] = [windReason];
    if (day.windSpeedMps > 14) {
      reasons.push('Strong winds reduce wave shape quality even when offshore.');
    }
    if (waveHeightScore < 50) {
      reasons.push('Wave height is outside the most surfable range.');
    }
    if (swellPeriodScore < 50) {
      reasons.push('Short swell period indicates weaker wave power.');
    }
    if (reasons.length === 1 && reasons[0].includes('Offshore-friendly')) {
      reasons.push('Swell and temperature profile support surfable conditions.');
    }

    return this.buildScore(factors, reasons);
  }
}

export const surfingScorer = new SurfingScorer();
