import { Kind, ValueNode, GraphQLScalarType } from 'graphql';
import { cityRepository } from './repositories/cityRepository';
import { cacheService } from './services/cache/cacheService';
import { weatherService } from './services/external/weatherService';
import { scoringService } from './services/scoring/scoringService';
import { topCitiesService } from './services/topCitiesService';
import { featureComputationService } from './services/features/featureComputationService';
import { poiSummaryService } from './services/features/poiSummaryService';
import { logger } from './utils/logger';
import { toGraphQLError } from './utils/graphql';

const context = 'Resolvers';

function parseLiteral(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value);
    case Kind.NULL:
      return null;
    case Kind.OBJECT:
      return ast.fields.reduce<Record<string, unknown>>((result, field) => {
        result[field.name.value] = parseLiteral(field.value);
        return result;
      }, {});
    case Kind.LIST:
      return ast.values.map(parseLiteral);
    default:
      return null;
  }
}

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON scalar value',
  serialize: (value: unknown) => value,
  parseValue: (value: unknown) => value,
  parseLiteral
});

export const resolvers = {
  JSON: JSONScalar,
  Query: {
    rank: async (_: unknown, args: { city: string }) => {
      try {
        return await scoringService.rankCity(args.city);
      } catch (error) {
        logger.error(context, 'rank query failed', { city: args.city, error });
        throw toGraphQLError(error);
      }
    },

    rankByCoordinates: async (
      _: unknown,
      args: { coordinates: { latitude: number; longitude: number }; locationName?: string }
    ) => {
      try {
        return await scoringService.rankByCoordinates(args.coordinates, args.locationName);
      } catch (error) {
        logger.error(context, 'rankByCoordinates query failed', { args, error });
        throw toGraphQLError(error);
      }
    },

    surfSpotScore: async (
      _: unknown,
      args: { coordinates: { latitude: number; longitude: number }; locationName?: string; coastFaceDeg?: number }
    ) => {
      try {
        return await scoringService.scoreSurfSpot(args.coordinates, args.locationName, args.coastFaceDeg);
      } catch (error) {
        logger.error(context, 'surfSpotScore query failed', { args, error });
        throw toGraphQLError(error);
      }
    },

    topCities: async (_: unknown, args: { activity: string; limit?: number }) => {
      try {
        return await topCitiesService.getTopCities(args.activity, args.limit ?? 12);
      } catch (error) {
        logger.error(context, 'topCities query failed', { args, error });
        throw toGraphQLError(error);
      }
    },

    marineData: async (_: unknown, args: { latitude: number; longitude: number }) => {
      try {
        return await weatherService.fetchMarineData({
          latitude: args.latitude,
          longitude: args.longitude
        });
      } catch (error) {
        logger.error(context, 'marineData query failed', { args, error });
        throw toGraphQLError(error);
      }
    },

    cityFeatures: async (_: unknown, args: { city: string; recompute?: boolean }) => {
      try {
        const { city, features } = await featureComputationService.getCityFeatureProfileByName(args.city, {
          recompute: args.recompute ?? false
        });

        return {
          cityId: city.id,
          cityName: city.name,
          country: city.country,
          features
        };
      } catch (error) {
        logger.error(context, 'cityFeatures query failed', { args, error });
        throw toGraphQLError(error);
      }
    },

    cityPoiSummary: async (_: unknown, args: { city: string; recompute?: boolean }) => {
      try {
        const { city, summary } = await poiSummaryService.getCityPoiSummaryByName(args.city, {
          forceRefresh: args.recompute ?? false
        });

        return {
          cityId: city.id,
          cityName: city.name,
          country: city.country,
          museumsCount: summary.museumsCount,
          galleriesCount: summary.galleriesCount,
          attractionsCount: summary.attractionsCount,
          poiCount: summary.poiCount,
          densityPer100Km2: summary.densityPer100Km2,
          populationProxy: summary.populationProxy,
          source: summary.source,
          confidence: summary.confidence,
          computedAt: summary.computedAt
        };
      } catch (error) {
        logger.error(context, 'cityPoiSummary query failed', { args, error });
        throw toGraphQLError(error);
      }
    },

    candidateCityFeatures: async (_: unknown, args: { limit?: number }) => {
      try {
        const results = await featureComputationService.listCandidateCityFeatures(args.limit ?? 50);
        return results.map((result) => ({
          cityId: result.city.id,
          cityName: result.city.name,
          country: result.city.country,
          features: result.features
        }));
      } catch (error) {
        logger.error(context, 'candidateCityFeatures query failed', { args, error });
        throw toGraphQLError(error);
      }
    },

    health: async () => {
      try {
        const redis = cacheService.isConnected() ? 'connected' : 'disconnected';
        const database = cityRepository.count() > 0 ? 'available' : 'unavailable';

        return {
          status: redis === 'connected' && database === 'available' ? 'healthy' : 'degraded',
          redis,
          database,
          message: 'Service is running'
        };
      } catch (error) {
        logger.error(context, 'health query failed', { error });
        return {
          status: 'unhealthy',
          redis: 'error',
          database: 'error',
          message: 'Health check failed'
        };
      }
    }
  }
};

export default resolvers;
