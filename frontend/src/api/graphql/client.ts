import { ApolloClient, HttpLink, InMemoryCache, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { config } from '../../config/env';

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach((error) => {
      console.error(`[GraphQL error] ${operation.operationName}:`, error.message, error.extensions);
    });
  }

  if (networkError) {
    console.error('[Network error]:', networkError);
  }
});

const httpLink = new HttpLink({
  uri: config.apiUrl
});

export const graphqlClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          topCities: {
            keyArgs: ['activity', 'limit']
          }
        }
      }
    }
  }),
  defaultOptions: {
    query: {
      errorPolicy: 'all'
    },
    watchQuery: {
      errorPolicy: 'all'
    }
  }
});
