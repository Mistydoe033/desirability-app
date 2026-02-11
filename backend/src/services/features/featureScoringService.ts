import { FEATURE_ALGORITHM, FEATURE_CATEGORIES } from '../../constants/constants';
import {
  CityFeatureProfile,
  CityPoiSummary,
  CityRecord,
  CityWeatherSummary,
  CoastOrientationResult,
  FeatureCategoryName,
  FeatureEvidenceEntry
} from '../../types/types';
import { createEmptyFeatureProfile } from './featureProfile';

function clamp0to100(value: number): number {
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
}

function scoreBand(value: number, thresholds: Array<{ min?: number; max?: number; score: number }>, fallback = 0): number {
  for (const threshold of thresholds) {
    const minOk = threshold.min === undefined || value >= threshold.min;
    const maxOk = threshold.max === undefined || value <= threshold.max;

    if (minOk && maxOk) {
      return threshold.score;
    }
  }

  return fallback;
}

function seasonalWindowGate(summary: CityWeatherSummary): boolean {
  const favorableSeasons = summary.summary.seasonalBuckets.filter((bucket) => bucket.pleasantDayPct >= 25).length;
  return favorableSeasons >= 2;
}

function skiingComputation(city: CityRecord, weather: CityWeatherSummary): { score: number; evidence: FeatureEvidenceEntry } {
  const elevationScore = scoreBand(city.elevationM ?? 0, [
    { min: 1500, score: 100 },
    { min: 1100, score: 85 },
    { min: 800, score: 65 },
    { min: 650, score: 45 },
    { min: 500, score: 25 }
  ], 10);

  const winterColdScore = scoreBand(weather.summary.winterMeanTempC, [
    { max: -5, score: 100 },
    { max: 0, score: 85 },
    { max: 4, score: 60 },
    { max: 8, score: 35 }
  ], 10);

  const snowProxyScore = clamp0to100(weather.summary.snowfallDayPct * 0.45 + weather.summary.freezingDayPct * 0.35 + weather.summary.skiViableDayPct * 0.2);
  const viableDayScore = clamp0to100(weather.summary.skiViableDayPct * 1.8);
  const hasSnowSignal = weather.summary.snowfallDayPct > 0 || weather.summary.skiViableDayPct > 0;

  const score = hasSnowSignal
    ? clamp0to100(
        elevationScore * 0.3 +
        winterColdScore * 0.3 +
        snowProxyScore * 0.25 +
        viableDayScore * 0.15
    )
    : 0;

  const gates = {
    elevation_gate: (city.elevationM ?? 0) >= 700,
    winter_temp_gate: weather.summary.winterMeanTempC <= 4,
    snow_presence_gate: hasSnowSignal,
    snow_probability_gate:
      weather.summary.skiViableDayPct >= 8 ||
      weather.summary.snowfallDayPct >= 6 ||
      weather.summary.freezingDayPct >= 20
  };

  return {
    score,
    evidence: {
      signals: {
        elevation_m: city.elevationM,
        winter_mean_temp_c: weather.summary.winterMeanTempC,
        snowfall_day_pct: weather.summary.snowfallDayPct,
        freezing_day_pct: weather.summary.freezingDayPct,
        ski_viable_day_pct: weather.summary.skiViableDayPct,
        annual_snowfall_cm: weather.summary.annualSnowfallCm,
        elevation_score: elevationScore,
        winter_cold_score: winterColdScore,
        snow_proxy_score: snowProxyScore,
        viable_day_score: viableDayScore
      },
      thresholds: {
        min_elevation_m: 700,
        max_winter_mean_temp_c: 4,
        min_snow_presence_pct: 0.1,
        min_ski_viable_day_pct: 8,
        min_snowfall_day_pct: 6,
        min_freezing_day_pct: 20,
        min_assignment_score: FEATURE_ALGORITHM.MIN_ASSIGNMENT_SCORE
      },
      gates,
      notes: Object.entries(gates)
        .filter(([, passed]) => !passed)
        .map(([name]) => `${name} failed`)
    }
  };
}

function surfingComputation(coast: CoastOrientationResult | null, weather: CityWeatherSummary): { score: number; evidence: FeatureEvidenceEntry } {
  const coastConfidence = coast?.confidence ?? 0;
  const isCoastal = coast?.source !== 'inland' && coast?.faceDeg !== null && coast?.faceDeg !== undefined;

  const coastScore = clamp0to100(coastConfidence * 100);
  const windScore = scoreBand(weather.summary.highWindDayPct, [
    { max: 15, score: 95 },
    { max: 30, score: 80 },
    { max: 45, score: 60 },
    { max: 55, score: 35 }
  ], 15);

  const tempMildScore = scoreBand(weather.summary.annualMeanTempC, [
    { min: 14, max: 26, score: 95 },
    { min: 10, max: 30, score: 75 },
    { min: 8, max: 33, score: 55 }
  ], 30);

  const seasonalityScore = scoreBand(weather.summary.annualTempRangeC, [
    { max: 12, score: 95 },
    { max: 18, score: 80 },
    { max: 25, score: 60 }
  ], 35);

  const score = isCoastal
    ? clamp0to100(
        coastScore * 0.35 +
          windScore * 0.25 +
          tempMildScore * 0.2 +
          seasonalityScore * 0.2
      )
    : 0;

  const gates = {
    coastal_gate: isCoastal,
    coast_confidence_gate: coastConfidence >= FEATURE_ALGORITHM.SURF_MIN_COAST_CONFIDENCE,
    wind_stability_gate: weather.summary.highWindDayPct <= 55,
    temp_gate: weather.summary.annualMeanTempC >= 8 && weather.summary.annualMeanTempC <= 33
  };

  return {
    score,
    evidence: {
      signals: {
        coast_source: coast?.source ?? 'missing',
        coast_face_deg: coast?.faceDeg ?? null,
        coast_confidence: coastConfidence,
        high_wind_day_pct: weather.summary.highWindDayPct,
        annual_mean_temp_c: weather.summary.annualMeanTempC,
        annual_temp_range_c: weather.summary.annualTempRangeC,
        coast_score: coastScore,
        wind_score: windScore,
        temp_mild_score: tempMildScore,
        seasonality_score: seasonalityScore
      },
      thresholds: {
        min_coast_confidence: FEATURE_ALGORITHM.SURF_MIN_COAST_CONFIDENCE,
        max_high_wind_day_pct: 55,
        annual_mean_temp_min_c: 8,
        annual_mean_temp_max_c: 33,
        min_assignment_score: FEATURE_ALGORITHM.MIN_ASSIGNMENT_SCORE
      },
      gates,
      notes: Object.entries(gates)
        .filter(([, passed]) => !passed)
        .map(([name]) => `${name} failed`)
    }
  };
}

function outdoorComputation(weather: CityWeatherSummary): { score: number; evidence: FeatureEvidenceEntry } {
  const pleasantScore = clamp0to100(weather.summary.pleasantDayPct);
  const precipScore = clamp0to100(100 - weather.summary.precipitationDayPct);
  const windScore = clamp0to100(100 - weather.summary.highWindDayPct);
  const visibilityScore = clamp0to100(weather.summary.visibilityGoodDayPct);
  const humidityScore = clamp0to100(weather.summary.humidityComfortDayPct);

  const score = clamp0to100(
    pleasantScore * 0.4 +
      precipScore * 0.2 +
      windScore * 0.15 +
      visibilityScore * 0.15 +
      humidityScore * 0.1
  );

  const gates = {
    pleasant_day_gate: weather.summary.pleasantDayPct >= 30,
    bad_outdoor_gate: weather.summary.badOutdoorDayPct <= 65,
    seasonal_window_gate: seasonalWindowGate(weather)
  };

  return {
    score,
    evidence: {
      signals: {
        pleasant_day_pct: weather.summary.pleasantDayPct,
        precipitation_day_pct: weather.summary.precipitationDayPct,
        high_wind_day_pct: weather.summary.highWindDayPct,
        visibility_good_day_pct: weather.summary.visibilityGoodDayPct,
        humidity_comfort_day_pct: weather.summary.humidityComfortDayPct,
        bad_outdoor_day_pct: weather.summary.badOutdoorDayPct,
        favorable_seasons: weather.summary.seasonalBuckets.filter((bucket) => bucket.pleasantDayPct >= 25).length,
        pleasant_score: pleasantScore,
        precip_score: precipScore,
        wind_score: windScore,
        visibility_score: visibilityScore,
        humidity_score: humidityScore
      },
      thresholds: {
        min_pleasant_day_pct: 30,
        max_bad_outdoor_day_pct: 65,
        min_favorable_seasons: 2,
        min_assignment_score: FEATURE_ALGORITHM.MIN_ASSIGNMENT_SCORE
      },
      gates,
      notes: Object.entries(gates)
        .filter(([, passed]) => !passed)
        .map(([name]) => `${name} failed`)
    }
  };
}

function indoorComputation(weather: CityWeatherSummary, poi: CityPoiSummary): { score: number; evidence: FeatureEvidenceEntry } {
  const hasPoiDataset = poi.source === 'overpass-openstreetmap' && poi.poiCount > 0;
  const weightedPoiEvidence =
    poi.museumsCount * 2.2 +
    poi.galleriesCount * 1.6 +
    poi.attractionsCount * 1.2;

  const poiScore = hasPoiDataset
    ? clamp0to100(Math.min(100, weightedPoiEvidence + poi.densityPer100Km2 * 18))
    : clamp0to100(Math.min(100, ((poi.populationProxy ?? 0) / 500000) * 100));

  const badWeatherScore = clamp0to100(Math.min(100, weather.summary.badOutdoorDayPct * 1.2));
  const extremesScore = clamp0to100((weather.summary.extremeHeatDayPct + weather.summary.extremeColdDayPct) * 2.5);
  const antiOutdoorScore = clamp0to100(100 - weather.summary.pleasantDayPct);

  const score = clamp0to100(
    poiScore * 0.7 +
      badWeatherScore * 0.15 +
      extremesScore * 0.08 +
      antiOutdoorScore * 0.07
  );

  const gates = {
    poi_or_population_gate: hasPoiDataset
      ? poi.densityPer100Km2 >= FEATURE_ALGORITHM.POI_DENSITY_GATE_PER_100KM2 || poi.poiCount >= FEATURE_ALGORITHM.POI_COUNT_GATE
      : (poi.populationProxy ?? 0) >= FEATURE_ALGORITHM.POPULATION_PROXY_GATE,
    weather_need_gate:
      weather.summary.badOutdoorDayPct >= 20 ||
      weather.summary.extremeHeatDayPct + weather.summary.extremeColdDayPct >= 8
  };

  return {
    score,
    evidence: {
      signals: {
        poi_source: poi.source,
        weighted_poi_evidence: weightedPoiEvidence,
        poi_count: poi.poiCount,
        museums_count: poi.museumsCount,
        galleries_count: poi.galleriesCount,
        attractions_count: poi.attractionsCount,
        poi_density_per_100km2: poi.densityPer100Km2,
        population_proxy: poi.populationProxy,
        bad_outdoor_day_pct: weather.summary.badOutdoorDayPct,
        extreme_heat_day_pct: weather.summary.extremeHeatDayPct,
        extreme_cold_day_pct: weather.summary.extremeColdDayPct,
        pleasant_day_pct: weather.summary.pleasantDayPct,
        poi_score: poiScore,
        bad_weather_score: badWeatherScore,
        extremes_score: extremesScore,
        anti_outdoor_score: antiOutdoorScore
      },
      thresholds: {
        min_poi_density_per_100km2: FEATURE_ALGORITHM.POI_DENSITY_GATE_PER_100KM2,
        min_poi_count: FEATURE_ALGORITHM.POI_COUNT_GATE,
        min_population_proxy: FEATURE_ALGORITHM.POPULATION_PROXY_GATE,
        min_bad_outdoor_day_pct: 20,
        min_extreme_weather_pct: 8,
        min_assignment_score: FEATURE_ALGORITHM.MIN_ASSIGNMENT_SCORE
      },
      gates,
      notes: Object.entries(gates)
        .filter(([, passed]) => !passed)
        .map(([name]) => `${name} failed`)
    }
  };
}

class FeatureScoringService {
  computeCityFeatureProfile(input: {
    city: CityRecord;
    coast: CoastOrientationResult | null;
    weatherSummary: CityWeatherSummary;
    poiSummary: CityPoiSummary;
  }): CityFeatureProfile {
    const profile = createEmptyFeatureProfile();

    const skiing = skiingComputation(input.city, input.weatherSummary);
    const surfing = surfingComputation(input.coast, input.weatherSummary);
    const outdoor = outdoorComputation(input.weatherSummary);
    const indoor = indoorComputation(input.weatherSummary, input.poiSummary);

    profile.scoresByFeature.Skiing = skiing.score;
    profile.scoresByFeature.Surfing = surfing.score;
    profile.scoresByFeature['Outdoor sightseeing'] = outdoor.score;
    profile.scoresByFeature['Indoor sightseeing'] = indoor.score;

    profile.evidence.Skiing = skiing.evidence;
    profile.evidence.Surfing = surfing.evidence;
    profile.evidence['Outdoor sightseeing'] = outdoor.evidence;
    profile.evidence['Indoor sightseeing'] = indoor.evidence;

    (FEATURE_CATEGORIES as readonly FeatureCategoryName[]).forEach((feature) => {
      const gates = profile.evidence[feature].gates;
      const allGatesPassed = Object.values(gates).every(Boolean);
      const score = profile.scoresByFeature[feature];

      if (allGatesPassed && score >= FEATURE_ALGORITHM.MIN_ASSIGNMENT_SCORE) {
        profile.selectedFeatures.push(feature);
      }
    });

    profile.computed_at = new Date().toISOString();
    profile.algorithm_version = FEATURE_ALGORITHM.VERSION;

    return profile;
  }
}

export const featureScoringService = new FeatureScoringService();
