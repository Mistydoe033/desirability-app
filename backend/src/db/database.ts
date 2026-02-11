import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { env } from '../config/env';
import { DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';

class DatabaseClient {
  private db: Database.Database;

  constructor() {
    const absolutePath = path.resolve(process.cwd(), env.DB_PATH);
    const dir = path.dirname(absolutePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(absolutePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    logger.info('Database', 'Opened SQLite database', { path: absolutePath });
  }

  get connection(): Database.Database {
    return this.db;
  }

  private recreateFeatureTables(): void {
    this.db.exec(`
      DROP TABLE IF EXISTS city_feature_assignments;
      DROP TABLE IF EXISTS city_feature_evidence;

      CREATE TABLE city_feature_assignments (
        city_id TEXT NOT NULL,
        feature TEXT NOT NULL CHECK(feature IN ('Skiing', 'Surfing', 'Outdoor sightseeing', 'Indoor sightseeing')),
        score REAL NOT NULL DEFAULT 0,
        computed_at TEXT NOT NULL,
        algorithm_version TEXT NOT NULL,
        PRIMARY KEY(city_id, feature),
        FOREIGN KEY(city_id) REFERENCES cities(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_city_feature_assignments_feature
        ON city_feature_assignments(feature);

      CREATE TABLE city_feature_evidence (
        city_id TEXT NOT NULL,
        feature TEXT NOT NULL CHECK(feature IN ('Skiing', 'Surfing', 'Outdoor sightseeing', 'Indoor sightseeing')),
        evidence_json TEXT NOT NULL,
        computed_at TEXT NOT NULL,
        algorithm_version TEXT NOT NULL,
        PRIMARY KEY(city_id, feature),
        FOREIGN KEY(city_id) REFERENCES cities(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_city_feature_evidence_feature
        ON city_feature_evidence(feature);
    `);
  }

  private ensureFeatureTables(): void {
    const assignmentsSqlRow = this.db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='city_feature_assignments'")
      .get() as { sql?: string } | undefined;

    const evidenceSqlRow = this.db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='city_feature_evidence'")
      .get() as { sql?: string } | undefined;

    const expectedCheck = "CHECK(feature IN ('Skiing', 'Surfing', 'Outdoor sightseeing', 'Indoor sightseeing'))";
    const assignmentsValid =
      Boolean(assignmentsSqlRow?.sql) &&
      assignmentsSqlRow!.sql!.includes(expectedCheck) &&
      assignmentsSqlRow!.sql!.includes('score REAL NOT NULL');
    const evidenceValid =
      Boolean(evidenceSqlRow?.sql) &&
      evidenceSqlRow!.sql!.includes(expectedCheck) &&
      evidenceSqlRow!.sql!.includes('evidence_json TEXT NOT NULL');

    if (!assignmentsValid || !evidenceValid) {
      this.recreateFeatureTables();
      return;
    }

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_city_feature_assignments_feature
        ON city_feature_assignments(feature);
      CREATE INDEX IF NOT EXISTS idx_city_feature_evidence_feature
        ON city_feature_evidence(feature);
    `);
  }

  private dropLegacyCityCoastTable(): void {
    this.db.exec('DROP TABLE IF EXISTS city_coast;');
  }

  private ensureCoreSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        elevation REAL,
        features TEXT NOT NULL DEFAULT '{}',
        is_candidate INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_cities_candidate ON cities(is_candidate);
      CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name COLLATE NOCASE);

      CREATE TABLE IF NOT EXISTS city_weather_summary (
        city_id TEXT PRIMARY KEY,
        sample_start TEXT NOT NULL,
        sample_end TEXT NOT NULL,
        sample_strategy TEXT NOT NULL,
        source TEXT NOT NULL,
        summary_json TEXT NOT NULL,
        algorithm_version TEXT NOT NULL,
        computed_at TEXT NOT NULL,
        FOREIGN KEY(city_id) REFERENCES cities(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_weather_summary_computed ON city_weather_summary(computed_at);

      CREATE TABLE IF NOT EXISTS city_poi_summary (
        city_id TEXT PRIMARY KEY,
        museums_count INTEGER NOT NULL,
        galleries_count INTEGER NOT NULL,
        attractions_count INTEGER NOT NULL,
        poi_count INTEGER NOT NULL,
        density_per_100km2 REAL NOT NULL,
        population_proxy INTEGER,
        source TEXT NOT NULL,
        confidence REAL NOT NULL,
        summary_json TEXT NOT NULL,
        algorithm_version TEXT NOT NULL,
        computed_at TEXT NOT NULL,
        FOREIGN KEY(city_id) REFERENCES cities(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_poi_summary_computed ON city_poi_summary(computed_at);

      CREATE TABLE IF NOT EXISTS city_rank_cache (
        city_id TEXT PRIMARY KEY,
        rank_json TEXT NOT NULL,
        computed_at TEXT NOT NULL,
        FOREIGN KEY(city_id) REFERENCES cities(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_city_rank_cache_computed ON city_rank_cache(computed_at);
    `);
  }

  initialize(): void {
    try {
      this.ensureCoreSchema();
      this.ensureFeatureTables();
      this.dropLegacyCityCoastTable();
    } catch (error) {
      throw new DatabaseError('Failed to initialize database schema', error);
    }
  }

  close(): void {
    this.db.close();
  }
}

export const databaseClient = new DatabaseClient();
