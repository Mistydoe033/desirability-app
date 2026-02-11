import http from 'http';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { env } from './config/env';
import { databaseClient } from './db/database';
import { seedDatabase } from './db/seed';
import { startFeatureComputeScheduler } from './jobs/featureComputeJob';
import { startPrecomputeScheduler } from './jobs/precomputeTopCities';
import { registerCoastlineRoutes } from './routes/coastlineRoutes';
import { registerHealthRoutes } from './routes/healthRoutes';
import resolvers from './resolvers';
import typeDefs from './schema';
import { cacheService } from './services/cache/cacheService';
import { coastlineDatasetService } from './services/coastline/coastlineDatasetService';
import { logger } from './utils/logger';

const context = 'Server';

async function startServer(): Promise<void> {
  databaseClient.initialize();
  seedDatabase();
  logger.info(context, 'Starting coastline dataset warmup in background');
  void coastlineDatasetService.initialize()
    .then(() => {
      logger.info(context, 'Coastline dataset ready', coastlineDatasetService.getStats());
    })
    .catch((error) => {
      logger.error(context, 'Coastline dataset warmup failed', error);
    });

  const precomputeScheduler = startPrecomputeScheduler();
  const featureScheduler = startFeatureComputeScheduler();

  const app = express();
  registerHealthRoutes(app);
  registerCoastlineRoutes(app);

  const graphqlServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    formatError: (error) => {
      logger.error(context, 'GraphQL error', {
        message: error.message,
        code: error.extensions?.code,
        details: error.extensions?.exception
      });
      return error;
    }
  });

  await graphqlServer.start();
  graphqlServer.applyMiddleware({ app: app as Parameters<typeof graphqlServer.applyMiddleware>[0]['app'], path: '/' });

  const httpServer = http.createServer(app);

  await new Promise<void>((resolve) => {
    httpServer.listen(env.GRAPHQL_PORT, env.GRAPHQL_HOST, resolve);
  });

  logger.info(context, 'GraphQL server started', {
    url: `http://${env.GRAPHQL_HOST}:${env.GRAPHQL_PORT}${graphqlServer.graphqlPath}`,
    host: env.GRAPHQL_HOST,
    port: env.GRAPHQL_PORT
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(context, `Received ${signal}; shutting down`);
    clearInterval(precomputeScheduler);
    clearInterval(featureScheduler);

    await graphqlServer.stop();

    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    await cacheService.close();
    databaseClient.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    shutdown('SIGINT').catch((error) => {
      logger.error(context, 'SIGINT shutdown failed', error);
      process.exit(1);
    });
  });

  process.on('SIGTERM', () => {
    shutdown('SIGTERM').catch((error) => {
      logger.error(context, 'SIGTERM shutdown failed', error);
      process.exit(1);
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error(context, 'Uncaught exception', error);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error(context, 'Unhandled promise rejection', reason);
  });
}

startServer().catch((error) => {
  logger.error(context, 'Failed to start server', error);
  process.exit(1);
});
