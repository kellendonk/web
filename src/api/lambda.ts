import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import { appRouter } from './AppRouter';
import { ApiHandler } from 'sst/node/api';
import { withTracer } from './powertools';

export const handler = ApiHandler(
  withTracer(
    awsLambdaRequestHandler({ router: appRouter }),
  ),
);
