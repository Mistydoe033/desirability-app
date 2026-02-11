import { databaseClient } from '../db/database';
import { FEATURE_CATEGORIES } from '../constants/constants';
import { CityFeatureProfile, CityRecord, CityRow, FeatureCategoryName, FeatureEvidenceEntry } from '../types/types';
import {
  createEmptyFeatureProfile,
  isFeatureActivity,
  parseCityFeatureProfile,
  sanitizeCityFeatureProfile
} from '../services/features/featureProfile';

interface FeatureAssignmentRow {
  feature: string;
  score: number;
  computed_at: string;
  algorithm_version: string;
}

interface FeatureEvidenceRow {
  feature: string;
  evidence_json: string;
  computed_at: string;
  algorithm_version: string;
}

class CityRepository {
  private readonly db = databaseClient.connection;

  private latestIso(left: string, right: string): string {
    if (!left) {
      return right;
    }
    if (!right) {
      return left;
    }
    return new Date(right).getTime() >= new Date(left).getTime() ? right : left;
  }

  private hydrateFeatureProfile(cityId: string, rawFeatures: string): CityFeatureProfile {
    const baseProfile = parseCityFeatureProfile(rawFeatures || JSON.stringify(createEmptyFeatureProfile()));

    const assignmentRows = this.db
      .prepare(
        `
          SELECT feature, score, computed_at, algorithm_version
          FROM city_feature_assignments
          WHERE city_id = ?
        `
      )
      .all(cityId) as FeatureAssignmentRow[];

    const evidenceRows = this.db
      .prepare(
        `
          SELECT feature, evidence_json, computed_at, algorithm_version
          FROM city_feature_evidence
          WHERE city_id = ?
        `
      )
      .all(cityId) as FeatureEvidenceRow[];

    if (assignmentRows.length === 0 && evidenceRows.length === 0) {
      return baseProfile;
    }

    const scoresByFeature: Record<FeatureCategoryName, number> = { ...baseProfile.scoresByFeature };
    const evidence: Record<FeatureCategoryName, FeatureEvidenceEntry> = {
      ...createEmptyFeatureProfile().evidence
    };

    (FEATURE_CATEGORIES as readonly FeatureCategoryName[]).forEach((feature) => {
      evidence[feature] = baseProfile.evidence[feature] ?? createEmptyFeatureProfile().evidence[feature];
    });

    let computedAt = baseProfile.computed_at;
    let algorithmVersion = baseProfile.algorithm_version;

    assignmentRows.forEach((row) => {
      if (!isFeatureActivity(row.feature)) {
        return;
      }

      scoresByFeature[row.feature] = Number.isFinite(row.score) ? row.score : 0;
      computedAt = this.latestIso(computedAt, row.computed_at);
      algorithmVersion = row.algorithm_version || algorithmVersion;
    });

    evidenceRows.forEach((row) => {
      if (!isFeatureActivity(row.feature)) {
        return;
      }

      try {
        const parsed = JSON.parse(row.evidence_json) as unknown;
        const sanitized = sanitizeCityFeatureProfile({
          scoresByFeature: {},
          evidence: { [row.feature]: parsed },
          computed_at: row.computed_at,
          algorithm_version: row.algorithm_version
        });
        evidence[row.feature] = sanitized.evidence[row.feature];
      } catch {
        evidence[row.feature] = createEmptyFeatureProfile().evidence[row.feature];
      }

      computedAt = this.latestIso(computedAt, row.computed_at);
      algorithmVersion = row.algorithm_version || algorithmVersion;
    });

    return sanitizeCityFeatureProfile({
      scoresByFeature,
      evidence,
      computed_at: computedAt,
      algorithm_version: algorithmVersion
    });
  }

  private mapRow(row: CityRow): CityRecord {
    return {
      id: row.id,
      name: row.name,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      elevationM: row.elevation,
      features: this.hydrateFeatureProfile(row.id, row.features),
      isCandidate: row.is_candidate === 1
    };
  }

  private syncFeatureAssignments(cityId: string, profile: CityFeatureProfile): void {
    this.db.prepare('DELETE FROM city_feature_assignments WHERE city_id = ?').run(cityId);

    const insert = this.db.prepare(
      `
        INSERT INTO city_feature_assignments (city_id, feature, score, computed_at, algorithm_version)
        VALUES (?, ?, ?, ?, ?)
      `
    );

    (FEATURE_CATEGORIES as readonly FeatureCategoryName[]).forEach((feature) => {
      insert.run(
        cityId,
        feature,
        profile.scoresByFeature[feature] ?? 0,
        profile.computed_at,
        profile.algorithm_version
      );
    });
  }

  private syncFeatureEvidence(cityId: string, profile: CityFeatureProfile): void {
    this.db.prepare('DELETE FROM city_feature_evidence WHERE city_id = ?').run(cityId);

    const insert = this.db.prepare(
      `
        INSERT INTO city_feature_evidence (city_id, feature, evidence_json, computed_at, algorithm_version)
        VALUES (?, ?, ?, ?, ?)
      `
    );

    (FEATURE_CATEGORIES as readonly FeatureCategoryName[]).forEach((feature) => {
      const evidence = profile.evidence[feature] ?? createEmptyFeatureProfile().evidence[feature];

      insert.run(
        cityId,
        feature,
        JSON.stringify(evidence),
        profile.computed_at,
        profile.algorithm_version
      );
    });
  }

  upsertCity(city: CityRecord): void {
    const sanitizedProfile = sanitizeCityFeatureProfile(city.features);
    const compactProfile = {
      scoresByFeature: sanitizedProfile.scoresByFeature,
      computed_at: sanitizedProfile.computed_at,
      algorithm_version: sanitizedProfile.algorithm_version
    };

    this.db
      .prepare(
        `
          INSERT INTO cities (id, name, country, latitude, longitude, elevation, features, is_candidate, updated_at)
          VALUES (@id, @name, @country, @latitude, @longitude, @elevation, @features, @is_candidate, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            country = excluded.country,
            latitude = excluded.latitude,
            longitude = excluded.longitude,
            elevation = excluded.elevation,
            features = excluded.features,
            is_candidate = excluded.is_candidate,
            updated_at = CURRENT_TIMESTAMP
        `
      )
      .run({
        id: city.id,
        name: city.name,
        country: city.country,
        latitude: city.latitude,
        longitude: city.longitude,
        elevation: city.elevationM,
        features: JSON.stringify(compactProfile),
        is_candidate: city.isCandidate ? 1 : 0
      });

    this.syncFeatureAssignments(city.id, sanitizedProfile);
    this.syncFeatureEvidence(city.id, sanitizedProfile);
  }

  upsertCities(cities: CityRecord[]): void {
    const transaction = this.db.transaction((items: CityRecord[]) => {
      items.forEach((city) => this.upsertCity(city));
    });

    transaction(cities);
  }

  updateFeatureProfile(cityId: string, profile: CityFeatureProfile): void {
    const sanitizedProfile = sanitizeCityFeatureProfile(profile);
    const compactProfile = {
      scoresByFeature: sanitizedProfile.scoresByFeature,
      computed_at: sanitizedProfile.computed_at,
      algorithm_version: sanitizedProfile.algorithm_version
    };

    this.db
      .prepare(
        `
          UPDATE cities
          SET features = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
      )
      .run(JSON.stringify(compactProfile), cityId);

    this.syncFeatureAssignments(cityId, sanitizedProfile);
    this.syncFeatureEvidence(cityId, sanitizedProfile);
  }

  findById(id: string): CityRecord | null {
    const row = this.db
      .prepare('SELECT * FROM cities WHERE id = ?')
      .get(id) as CityRow | undefined;

    return row ? this.mapRow(row) : null;
  }

  findByName(name: string): CityRecord | null {
    const row = this.db
      .prepare('SELECT * FROM cities WHERE lower(name) = lower(?) LIMIT 1')
      .get(name) as CityRow | undefined;

    return row ? this.mapRow(row) : null;
  }

  listAll(): CityRecord[] {
    const rows = this.db.prepare('SELECT * FROM cities ORDER BY name ASC').all() as CityRow[];
    return rows.map((row) => this.mapRow(row));
  }

  listCandidateCities(limit: number): CityRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM cities WHERE is_candidate = 1 ORDER BY name ASC LIMIT ?')
      .all(limit) as CityRow[];

    return rows.map((row) => this.mapRow(row));
  }

  listAllCandidateCities(): CityRecord[] {
    const rows = this.db
      .prepare('SELECT * FROM cities WHERE is_candidate = 1 ORDER BY name ASC')
      .all() as CityRow[];

    return rows.map((row) => this.mapRow(row));
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM cities').get() as { count: number };
    return row.count;
  }

  normalizeFeaturePayloads(): void {
    const rows = this.db.prepare('SELECT id, features FROM cities').all() as Array<{ id: string; features: string }>;
    rows.forEach((row) => {
      const normalized = this.hydrateFeatureProfile(row.id, row.features);
      this.updateFeatureProfile(row.id, normalized);
    });
  }
}

export const cityRepository = new CityRepository();
