import { gql } from 'apollo-server-express';

const typeDefs = gql`
  scalar JSON

  input CoordinatesInput {
    latitude: Float!
    longitude: Float!
  }

  type Factor {
    name: String!
    value: JSON!
    weight: Float!
    score0to100: Float!
    impact: String!
  }

  type ScoreDetail {
    score0to100: Float!
    rating: String!
    factors: [Factor!]!
    reasons: [String!]!
  }

  type DailyScore {
    date: String!
    detail: ScoreDetail!
  }

  type ActivityResult {
    activity: String!
    dayScores: [DailyScore!]!
    week: ScoreDetail!
  }

  type ForecastDay {
    date: String!
    tempCMax: Float!
    tempCMin: Float!
    precipitationMm: Float!
    precipitationProbabilityPct: Float!
    windSpeedMps: Float!
    windFromDeg: Float
    uvIndex: Float
    visibilityKm: Float
    snowDepthCm: Float!
    snowfallCm: Float!
  }

  type CoastOrientation {
    faceDeg: Float
    source: String!
    confidence: Float!
    updatedAt: String
    segmentCount: Int
    nearestDistanceKm: Float
  }

  type RankResult {
    location: String!
    latitude: Float!
    longitude: Float!
    forecast: [ForecastDay!]!
    coast: CoastOrientation
    activities: [ActivityResult!]!
  }

  type ActivityScoreSummary {
    activity: String!
    score0to100: Float!
  }

  type TopCity {
    id: ID!
    name: String!
    country: String!
    latitude: Float!
    longitude: Float!
    elevationM: Float
    features: [String!]!
    rating: Float!
    weeklyScore: Float!
    yearlyScore: Float!
    activities: [ActivityScoreSummary!]!
  }

  type MarineHourly {
    time: [String!]!
    waveHeightM: [Float!]!
    waveDirectionDeg: [Float!]!
    wavePeriodS: [Float!]!
    swellWaveHeightM: [Float!]!
    swellWaveDirectionDeg: [Float!]!
    swellWavePeriodS: [Float!]!
    seaSurfaceTemperatureC: [Float!]!
  }

  type MarineData {
    latitude: Float!
    longitude: Float!
    timezone: String
    hourly: MarineHourly!
  }

  type CityFeatureProfile {
    selectedFeatures: [String!]!
    scoresByFeature: JSON!
    evidence: JSON!
    computed_at: String!
    algorithm_version: String!
  }

  type CityFeatureResult {
    cityId: ID!
    cityName: String!
    country: String!
    features: CityFeatureProfile!
  }

  type CityPoiSummaryResult {
    cityId: ID!
    cityName: String!
    country: String!
    museumsCount: Int!
    galleriesCount: Int!
    attractionsCount: Int!
    poiCount: Int!
    densityPer100Km2: Float!
    populationProxy: Int
    source: String!
    confidence: Float!
    computedAt: String!
  }

  type HealthStatus {
    status: String!
    redis: String!
    database: String!
    message: String!
  }

  type Query {
    rank(city: String!): RankResult!
    rankByCoordinates(coordinates: CoordinatesInput!, locationName: String): RankResult!
    surfSpotScore(coordinates: CoordinatesInput!, locationName: String, coastFaceDeg: Float): ActivityResult!
    topCities(activity: String!, limit: Int): [TopCity!]!
    marineData(latitude: Float!, longitude: Float!): MarineData!
    cityFeatures(city: String!, recompute: Boolean = false): CityFeatureResult!
    cityPoiSummary(city: String!, recompute: Boolean = false): CityPoiSummaryResult!
    candidateCityFeatures(limit: Int): [CityFeatureResult!]!
    health: HealthStatus!
  }
`;

export default typeDefs;
