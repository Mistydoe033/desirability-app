import { gql } from '@apollo/client';

export const RANK_QUERY = gql`
  query Rank($city: String!) {
    rank(city: $city) {
      location
      latitude
      longitude
      coast {
        faceDeg
        source
        confidence
        updatedAt
      }
      forecast {
        date
        tempCMax
        tempCMin
        precipitationMm
        precipitationProbabilityPct
        windSpeedMps
        windFromDeg
        uvIndex
        visibilityKm
        snowDepthCm
        snowfallCm
      }
      activities {
        activity
        week {
          score0to100
          rating
          reasons
          factors {
            name
            value
            weight
            score0to100
            impact
          }
        }
        dayScores {
          date
          detail {
            score0to100
            rating
            reasons
            factors {
              name
              value
              weight
              score0to100
              impact
            }
          }
        }
      }
    }
  }
`;

export const TOP_CITIES_QUERY = gql`
  query TopCities($activity: String!, $limit: Int) {
    topCities(activity: $activity, limit: $limit) {
      id
      name
      country
      latitude
      longitude
      elevationM
      features
      rating
      weeklyScore
      yearlyScore
      activities {
        activity
        score0to100
      }
    }
  }
`;

export const MARINE_DATA_QUERY = gql`
  query MarineData($latitude: Float!, $longitude: Float!) {
    marineData(latitude: $latitude, longitude: $longitude) {
      latitude
      longitude
      timezone
      hourly {
        time
        waveHeightM
        waveDirectionDeg
        wavePeriodS
        swellWaveHeightM
        swellWaveDirectionDeg
        swellWavePeriodS
        seaSurfaceTemperatureC
      }
    }
  }
`;

export const SURF_SPOT_SCORE_QUERY = gql`
  query SurfSpotScore($coordinates: CoordinatesInput!, $locationName: String) {
    surfSpotScore(coordinates: $coordinates, locationName: $locationName) {
      activity
      week {
        score0to100
        rating
        reasons
        factors {
          name
          value
          weight
          score0to100
          impact
        }
      }
      dayScores {
        date
        detail {
          score0to100
          rating
          reasons
          factors {
            name
            value
            weight
            score0to100
            impact
          }
        }
      }
    }
  }
`;

export const RANK_BY_COORDINATES_QUERY = gql`
  query RankByCoordinates($coordinates: CoordinatesInput!, $locationName: String) {
    rankByCoordinates(coordinates: $coordinates, locationName: $locationName) {
      location
      latitude
      longitude
      coast {
        faceDeg
        source
        confidence
        updatedAt
      }
      forecast {
        date
        tempCMax
        tempCMin
        precipitationMm
        precipitationProbabilityPct
        windSpeedMps
        windFromDeg
        uvIndex
        visibilityKm
        snowDepthCm
        snowfallCm
      }
      activities {
        activity
        week {
          score0to100
          rating
          reasons
          factors {
            name
            value
            weight
            score0to100
            impact
          }
        }
        dayScores {
          date
          detail {
            score0to100
            rating
            reasons
            factors {
              name
              value
              weight
              score0to100
              impact
            }
          }
        }
      }
    }
  }
`;

export const CITY_POI_SUMMARY_QUERY = gql`
  query CityPoiSummary($city: String!, $recompute: Boolean) {
    cityPoiSummary(city: $city, recompute: $recompute) {
      cityId
      cityName
      country
      museumsCount
      galleriesCount
      attractionsCount
      poiCount
      densityPer100Km2
      populationProxy
      source
      confidence
      computedAt
    }
  }
`;

export const CITY_FEATURES_QUERY = gql`
  query CityFeatures($city: String!, $recompute: Boolean) {
    cityFeatures(city: $city, recompute: $recompute) {
      cityId
      cityName
      country
      features {
        selectedFeatures
        scoresByFeature
        evidence
        computed_at
        algorithm_version
      }
    }
  }
`;
