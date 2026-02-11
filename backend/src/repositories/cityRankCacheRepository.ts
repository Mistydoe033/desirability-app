import { databaseClient } from '../db/database';
import { RankResult } from '../types/types';

interface CityRankCacheRow {
  city_id: string;
  rank_json: string;
  computed_at: string;
}

class CityRankCacheRepository {
  private readonly db = databaseClient.connection;

  findByCityId(cityId: string): { result: RankResult; computedAt: string } | null {
    const row = this.db
      .prepare('SELECT city_id, rank_json, computed_at FROM city_rank_cache WHERE city_id = ?')
      .get(cityId) as CityRankCacheRow | undefined;

    if (!row) {
      return null;
    }

    return {
      result: JSON.parse(row.rank_json) as RankResult,
      computedAt: row.computed_at
    };
  }

  upsert(cityId: string, result: RankResult, computedAt: string): void {
    this.db
      .prepare(
        `
          INSERT INTO city_rank_cache (city_id, rank_json, computed_at)
          VALUES (?, ?, ?)
          ON CONFLICT(city_id) DO UPDATE SET
            rank_json = excluded.rank_json,
            computed_at = excluded.computed_at
        `
      )
      .run(cityId, JSON.stringify(result), computedAt);
  }
}

export const cityRankCacheRepository = new CityRankCacheRepository();
