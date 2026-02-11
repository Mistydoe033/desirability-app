export type ActivityName = 'Skiing' | 'Surfing' | 'Outdoor sightseeing' | 'Indoor sightseeing';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoLocation {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  country?: string;
}

export interface Factor {
  name: string;
  value: string | number;
  weight: number;
  score0to100: number;
  impact: 'positive' | 'neutral' | 'negative';
}

export interface ScoreDetail {
  score0to100: number;
  rating: string;
  factors: Factor[];
  reasons: string[];
}

export interface DailyScore {
  date: string;
  detail: ScoreDetail;
}

export interface ActivityResult {
  activity: ActivityName;
  dayScores: DailyScore[];
  week: ScoreDetail;
}

export interface ForecastDay {
  date: string;
  tempCMax: number;
  tempCMin: number;
  precipitationMm: number;
  precipitationProbabilityPct: number;
  windSpeedMps: number;
  windFromDeg: number | null;
  uvIndex: number | null;
  visibilityKm: number | null;
  snowDepthCm: number;
  snowfallCm: number;
}

export interface CoastOrientation {
  faceDeg: number;
  source: string;
  confidence: number;
  updatedAt?: string;
}

export interface RankResult {
  location: string;
  latitude: number;
  longitude: number;
  forecast: ForecastDay[];
  coast: CoastOrientation | null;
  activities: ActivityResult[];
}

export interface RankQueryData {
  rank: RankResult;
}

export interface RankQueryVariables {
  city: string;
}

export interface RankByCoordinatesQueryData {
  rankByCoordinates: RankResult;
}

export interface RankByCoordinatesQueryVariables {
  coordinates: Coordinates;
  locationName?: string;
}

export interface TopCity {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  elevationM: number | null;
  features: string[];
  rating: number;
  weeklyScore: number;
  yearlyScore: number;
  activities: Array<{
    activity: ActivityName;
    score0to100: number;
  }>;
}

export interface TopCitiesQueryData {
  topCities: TopCity[];
}

export interface TopCitiesQueryVariables {
  activity: ActivityName;
  limit?: number;
}

export interface MarineData {
  latitude: number;
  longitude: number;
  timezone: string | null;
  hourly: {
    time: string[];
    waveHeightM: number[];
    waveDirectionDeg: number[];
    wavePeriodS: number[];
    swellWaveHeightM: number[];
    swellWaveDirectionDeg: number[];
    swellWavePeriodS: number[];
    seaSurfaceTemperatureC: number[];
  };
}

export interface MarineDataQueryData {
  marineData: MarineData;
}

export interface MarineDataQueryVariables {
  latitude: number;
  longitude: number;
}

export interface SurfSpotScoreQueryData {
  surfSpotScore: ActivityResult;
}

export interface SurfSpotScoreQueryVariables {
  coordinates: Coordinates;
  locationName?: string;
}

export interface CityPoiSummaryResult {
  cityId: string;
  cityName: string;
  country: string;
  museumsCount: number;
  galleriesCount: number;
  attractionsCount: number;
  poiCount: number;
  densityPer100Km2: number;
  populationProxy: number | null;
  source: string;
  confidence: number;
  computedAt: string;
}

export interface CityPoiSummaryQueryData {
  cityPoiSummary: CityPoiSummaryResult;
}

export interface CityPoiSummaryQueryVariables {
  city: string;
  recompute?: boolean;
}

export interface CityFeatureProfileResult {
  selectedFeatures: string[];
  scoresByFeature: Record<string, number>;
  evidence: Record<string, { signals?: Record<string, unknown> }>;
  computed_at: string;
  algorithm_version: string;
}

export interface CityFeaturesQueryData {
  cityFeatures: {
    cityId: string;
    cityName: string;
    country: string;
    features: CityFeatureProfileResult;
  };
}

export interface CityFeaturesQueryVariables {
  city: string;
  recompute?: boolean;
}
