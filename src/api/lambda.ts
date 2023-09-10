import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import { appRouter } from './AppRouter';
import { ApiHandler } from 'sst/node/api';

export const handler = ApiHandler(awsLambdaRequestHandler({
  router: appRouter,
}));