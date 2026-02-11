export type ActivityName = 'Skiing' | 'Surfing' | 'Outdoor sightseeing' | 'Indoor sightseeing';
export type FeatureCategoryName = ActivityName;
export type FeatureActivity = ActivityName;

export type ScoreRating = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Not Suitable';

export type FactorImpact = 'positive' | 'neutral' | 'negative';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type GeoJsonPoint = [number, number];

export interface CoastlineLineStringGeometry {
  type: 'LineString';
  coordinates: GeoJsonPoint[];
}

export interface CoastlineMultiLineStringGeometry {
  type: 'MultiLineString';
  coordinates: GeoJsonPoint[][];
}

export type CoastlineGeometry = CoastlineLineStringGeometry | CoastlineMultiLineStringGeometry;

export interface CoastlineFeature {
  type: 'Feature';
  geometry: CoastlineGeometry;
  properties: Record<string, unknown> | null;
}

export interface CoastlineFeatureCollection {
  type: 'FeatureCollection';
  features: CoastlineFeature[];
}

export interface CoastlineSegmentCandidate {
  distanceKm: number;
  tangentDeg: number;
  lengthKm: number;
}

export interface GeocodingResult {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  elevationM?: number | null;
  population?: number | null;
}

export interface ForecastDay {
  date: string;
  tempCMax: number;
  tempCMin: number;
  precipitationMm: number;
  precipitationProbabilityPct: number;
  windSpeedMps: number;
  windFromDeg: number | null;
  humidityPct: number | null;
  uvIndex: number | null;
  visibilityKm: number | null;
  snowfallCm: number;
  snowDepthCm: number;
}

export interface MarineHourly {
  time: string[];
  waveHeightM: number[];
  waveDirectionDeg: number[];
  wavePeriodS: number[];
  swellWaveHeightM: number[];
  swellWaveDirectionDeg: number[];
  swellWavePeriodS: number[];
  seaSurfaceTemperatureC: number[];
}

export interface MarineData {
  latitude: number;
  longitude: number;
  timezone: string | null;
  hourly: MarineHourly;
}

export interface DailyMarineSummary {
  date: string;
  swellHeightM: number | null;
  swellPeriodS: number | null;
  swellDirectionDeg: number | null;
  waveHeightM: number | null;
  seaSurfaceTempC: number | null;
}

export interface WeatherBundle {
  location: string;
  latitude: number;
  longitude: number;
  elevationM: number | null;
  timezone: string | null;
  forecastDays: ForecastDay[];
  marineDaily: DailyMarineSummary[];
}

export interface FeatureEvidenceEntry {
  signals: Record<string, number | string | boolean | null>;
  thresholds: Record<string, number | string | boolean>;
  gates: Record<string, boolean>;
  notes: string[];
}

export interface CityFeatureProfile {
  selectedFeatures: FeatureCategoryName[];
  scoresByFeature: Record<FeatureCategoryName, number>;
  evidence: Record<FeatureCategoryName, FeatureEvidenceEntry>;
  computed_at: string;
  algorithm_version: string;
}

export interface CityRecord {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  elevationM: number | null;
  features: CityFeatureProfile;
  isCandidate: boolean;
}

export interface CityRow {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number | null;
  features: string;
  is_candidate: number;
}

export interface CityWeatherSummaryRecord {
  cityId: string;
  sampleStart: string;
  sampleEnd: string;
  sampleStrategy: string;
  source: string;
  summaryJson: string;
  algorithmVersion: string;
  computedAt: string;
}

export interface CityWeatherSummaryRow {
  city_id: string;
  sample_start: string;
  sample_end: string;
  sample_strategy: string;
  source: string;
  summary_json: string;
  algorithm_version: string;
  computed_at: string;
}

export interface SeasonalBucketSummary {
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  meanTempC: number;
  precipitationDayPct: number;
  highWindDayPct: number;
  pleasantDayPct: number;
}

export interface ClimateSummary {
  annualMeanTempC: number;
  annualTempRangeC: number;
  winterMeanTempC: number;
  summerMeanTempC: number;
  precipitationDayPct: number;
  heavyPrecipDayPct: number;
  highWindDayPct: number;
  pleasantDayPct: number;
  badOutdoorDayPct: number;
  snowfallDayPct: number;
  annualSnowfallCm: number;
  freezingDayPct: number;
  humidityComfortDayPct: number;
  visibilityGoodDayPct: number;
  extremeHeatDayPct: number;
  extremeColdDayPct: number;
  skiViableDayPct: number;
  seasonalBuckets: SeasonalBucketSummary[];
}

export interface CityWeatherSummary {
  cityId: string;
  sampleStart: string;
  sampleEnd: string;
  sampleStrategy: string;
  source: string;
  summary: ClimateSummary;
  algorithmVersion: string;
  computedAt: string;
}

export interface CityPoiSummaryRecord {
  cityId: string;
  museumsCount: number;
  galleriesCount: number;
  attractionsCount: number;
  poiCount: number;
  densityPer100Km2: number;
  populationProxy: number | null;
  source: string;
  confidence: number;
  summaryJson: string;
  algorithmVersion: string;
  computedAt: string;
}

export interface CityPoiSummaryRow {
  city_id: string;
  museums_count: number;
  galleries_count: number;
  attractions_count: number;
  poi_count: number;
  density_per_100km2: number;
  population_proxy: number | null;
  source: string;
  confidence: number;
  summary_json: string;
  algorithm_version: string;
  computed_at: string;
}

export interface CityPoiSummary {
  cityId: string;
  museumsCount: number;
  galleriesCount: number;
  attractionsCount: number;
  poiCount: number;
  densityPer100Km2: number;
  populationProxy: number | null;
  source: string;
  confidence: number;
  summary: Record<string, unknown>;
  algorithmVersion: string;
  computedAt: string;
}

export interface Factor {
  name: string;
  value: string | number;
  weight: number;
  score0to100: number;
  impact: FactorImpact;
}

export interface ScoreDetail {
  score0to100: number;
  rating: ScoreRating;
  factors: Factor[];
  reasons: string[];
}

export interface DailyScore {
  date: string;
  detail: ScoreDetail;
}

export interface ActivityScoreResult {
  activity: ActivityName;
  dayScores: DailyScore[];
  week: ScoreDetail;
}

export interface RankResult {
  location: string;
  latitude: number;
  longitude: number;
  forecast: ForecastDay[];
  coast: CoastOrientationResult | null;
  activities: ActivityScoreResult[];
}

export interface TopCityActivityScore {
  activity: ActivityName;
  score0to100: number;
}

export interface TopCityResult {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  elevationM: number | null;
  features: FeatureCategoryName[];
  rating: number;
  weeklyScore: number;
  yearlyScore: number;
  activities: TopCityActivityScore[];
}

export interface CoastOrientationResult {
  faceDeg: number | null;
  source: string;
  confidence: number;
  updatedAt?: string;
  segmentCount?: number;
  nearestDistanceKm?: number;
}

export interface ScoringDayInput {
  date: string;
  tempCMax: number;
  tempCMin: number;
  precipitationMm: number;
  precipitationProbabilityPct: number;
  windSpeedMps: number;
  windFromDeg: number | null;
  humidityPct: number | null;
  uvIndex: number | null;
  visibilityKm: number | null;
  snowDepthCm: number;
  snowfallCm: number;
  elevationM: number | null;
  swellHeightM: number | null;
  swellPeriodS: number | null;
  swellDirectionDeg: number | null;
  seaSurfaceTempC: number | null;
  waveHeightM: number | null;
}

export interface ScoringContext {
  coastFaceDeg: number | null;
}

export interface ActivityScorer {
  readonly activity: ActivityName;
  scoreDay(day: ScoringDayInput, context: ScoringContext): ScoreDetail;
  scoreWeek(days: ScoringDayInput[], context: ScoringContext): ActivityScoreResult;
}

export interface ParsedEnv {
  LOG_LEVEL: string;
  WEATHER_API_BASE_URL: string;
  WEATHER_ARCHIVE_API_BASE_URL: string;
  MARINE_API_BASE_URL: string;
  GEOCODING_API_BASE_URL: string;
  OVERPASS_API_INTERPRETER_URL: string;
  COASTLINE_GEOJSON_PATH: string;
  COASTLINE_MAX_POINTS_PER_LINE: number;
  FORECAST_DAYS: number;
  API_REQUEST_TIMEOUT_MS: number;
  API_MAX_RETRIES: number;
  API_RETRY_DELAY_MS: number;
  REDIS_URL: string;
  REDIS_OP_TIMEOUT_MS: number;
  CACHE_TTL_MINUTES: number;
  PRECOMPUTE_CACHE_TTL_MINUTES: number;
  DB_PATH: string;
  API_CONCURRENCY_LIMIT: number;
  PRECOMPUTE_CONCURRENCY_LIMIT: number;
  PRECOMPUTE_INTERVAL_MINUTES: number;
  PRECOMPUTE_TOP_CITIES_LIMIT: number;
  PRECOMPUTE_CANDIDATE_LIMIT: number;
  FEATURE_COMPUTE_INTERVAL_MINUTES: number;
  GRAPHQL_PORT: number;
  GRAPHQL_HOST: string;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  redis: 'connected' | 'disconnected' | 'error';
  database: 'available' | 'unavailable' | 'error';
  message: string;
}
