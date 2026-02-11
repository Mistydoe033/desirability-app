import { databaseClient } from '../db/database';
import {
  CityWeatherSummary,
  CityWeatherSummaryRecord,
  CityWeatherSummaryRow,
  ClimateSummary
} from '../types/types';

function mapRow(row: CityWeatherSummaryRow): CityWeatherSummary {
  return {
    cityId: row.city_id,
    sampleStart: row.sample_start,
    sampleEnd: row.sample_end,
    sampleStrategy: row.sample_strategy,
    source: row.source,
    summary: JSON.parse(row.summary_json) as ClimateSummary,
    algorithmVersion: row.algorithm_version,
    computedAt: row.computed_at
  };
}

class CityWeatherSummaryRepository {
  private readonly db = databaseClient.connection;

  findByCityId(cityId: string): CityWeatherSummary | null {
    const row = this.db
      .prepare('SELECT * FROM city_weather_summary WHERE city_id = ?')
      .get(cityId) as CityWeatherSummaryRow | undefined;

    return row ? mapRow(row) : null;
  }

  upsert(record: CityWeatherSummaryRecord): void {
    this.db
      .prepare(
        `
          INSERT INTO city_weather_summary (
            city_id, sample_start, sample_end, sample_strategy, source, summary_json, algorithm_version, computed_at
          )
          VALUES (
            @city_id, @sample_start, @sample_end, @sample_strategy, @source, @summary_json, @algorithm_version, @computed_at
          )
          ON CONFLICT(city_id) DO UPDATE SET
            sample_start = excluded.sample_start,
            sample_end = excluded.sample_end,
            sample_strategy = excluded.sample_strategy,
            source = excluded.source,
            summary_json = excluded.summary_json,
            algorithm_version = excluded.algorithm_version,
            computed_at = excluded.computed_at
        `
      )
      .run({
        city_id: record.cityId,
        sample_start: record.sampleStart,
        sample_end: record.sampleEnd,
        sample_strategy: record.sampleStrategy,
        source: record.source,
        summary_json: record.summaryJson,
        algorithm_version: record.algorithmVersion,
        computed_at: record.computedAt
      });
  }
}

export const cityWeatherSummaryRepository = new CityWeatherSummaryRepository();
