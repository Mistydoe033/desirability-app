import { DailyMarineSummary, ForecastDay, ScoringDayInput } from '../../types/types';

export function buildScoringDays(
  forecastDays: ForecastDay[],
  marineDaily: DailyMarineSummary[],
  elevationM: number | null
): ScoringDayInput[] {
  const marineByDate = new Map(marineDaily.map((item) => [item.date, item]));

  return forecastDays.map((day) => {
    const marine = marineByDate.get(day.date);

    return {
      date: day.date,
      tempCMax: day.tempCMax,
      tempCMin: day.tempCMin,
      precipitationMm: day.precipitationMm,
      precipitationProbabilityPct: day.precipitationProbabilityPct,
      windSpeedMps: day.windSpeedMps,
      windFromDeg: day.windFromDeg,
      humidityPct: day.humidityPct,
      uvIndex: day.uvIndex,
      visibilityKm: day.visibilityKm,
      snowDepthCm: day.snowDepthCm,
      snowfallCm: day.snowfallCm,
      elevationM,
      swellHeightM: marine?.swellHeightM ?? null,
      swellPeriodS: marine?.swellPeriodS ?? null,
      swellDirectionDeg: marine?.swellDirectionDeg ?? null,
      seaSurfaceTempC: marine?.seaSurfaceTempC ?? null,
      waveHeightM: marine?.waveHeightM ?? null
    };
  });
}
