import { ApolloError } from 'apollo-server-errors';
import { AppError, toAppError } from './errors';

export function toGraphQLError(error: unknown): ApolloError {
  const appError: AppError = toAppError(error);
  return new ApolloError(appError.message, appError.code, {
    statusCode: appError.statusCode,
    details: appError.details
  });
}
