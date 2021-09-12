import type * as lambda from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { ensureEnv } from '../util/ensure-env';
import { VisitCounterResponse } from './api';
import { FUNCTION_DATABASE_ENV_NAME } from './constants';
import { VisitCounter } from './visit-counter';

const tableName = ensureEnv(FUNCTION_DATABASE_ENV_NAME);
const dynamoDB = new AWS.DynamoDB();

export async function handler(
  event: lambda.APIGatewayProxyEventV2,
  _context: unknown,
): Promise<lambda.APIGatewayProxyResultV2> {
  const visitCounter = VisitCounter.expressionIncrementing({
    dynamoDB,
    tableName,
  });

  const visitCount = await visitCounter.visit();

  const response: VisitCounterResponse = {
    visitCount,
  };

  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(response),
  };
}
