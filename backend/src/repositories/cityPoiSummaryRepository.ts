import { databaseClient } from '../db/database';
import {
  CityPoiSummary,
  CityPoiSummaryRecord,
  CityPoiSummaryRow
} from '../types/types';

function mapRow(row: CityPoiSummaryRow): CityPoiSummary {
  return {
    cityId: row.city_id,
    museumsCount: row.museums_count,
    galleriesCount: row.galleries_count,
    attractionsCount: row.attractions_count,
    poiCount: row.poi_count,
    densityPer100Km2: row.density_per_100km2,
    populationProxy: row.population_proxy,
    source: row.source,
    confidence: row.confidence,
    summary: JSON.parse(row.summary_json) as Record<string, unknown>,
    algorithmVersion: row.algorithm_version,
    computedAt: row.computed_at
  };
}

class CityPoiSummaryRepository {
  private readonly db = databaseClient.connection;

  findByCityId(cityId: string): CityPoiSummary | null {
    const row = this.db
      .prepare('SELECT * FROM city_poi_summary WHERE city_id = ?')
      .get(cityId) as CityPoiSummaryRow | undefined;

    return row ? mapRow(row) : null;
  }

  upsert(record: CityPoiSummaryRecord): void {
    this.db
      .prepare(
        `
          INSERT INTO city_poi_summary (
            city_id,
            museums_count,
            galleries_count,
            attractions_count,
            poi_count,
            density_per_100km2,
            population_proxy,
            source,
            confidence,
            summary_json,
            algorithm_version,
            computed_at
          )
          VALUES (
            @city_id,
            @museums_count,
            @galleries_count,
            @attractions_count,
            @poi_count,
            @density_per_100km2,
            @population_proxy,
            @source,
            @confidence,
            @summary_json,
            @algorithm_version,
            @computed_at
          )
          ON CONFLICT(city_id) DO UPDATE SET
            museums_count = excluded.museums_count,
            galleries_count = excluded.galleries_count,
            attractions_count = excluded.attractions_count,
            poi_count = excluded.poi_count,
            density_per_100km2 = excluded.density_per_100km2,
            population_proxy = excluded.population_proxy,
            source = excluded.source,
            confidence = excluded.confidence,
            summary_json = excluded.summary_json,
            algorithm_version = excluded.algorithm_version,
            computed_at = excluded.computed_at
        `
      )
      .run({
        city_id: record.cityId,
        museums_count: record.museumsCount,
        galleries_count: record.galleriesCount,
        attractions_count: record.attractionsCount,
        poi_count: record.poiCount,
        density_per_100km2: record.densityPer100Km2,
        population_proxy: record.populationProxy,
        source: record.source,
        confidence: record.confidence,
        summary_json: record.summaryJson,
        algorithm_version: record.algorithmVersion,
        computed_at: record.computedAt
      });
  }
}

export const cityPoiSummaryRepository = new CityPoiSummaryRepository();
