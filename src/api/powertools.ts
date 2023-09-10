import { Tracer } from '@aws-lambda-powertools/tracer';
import { Logger } from '@aws-lambda-powertools/logger';
import { Config } from 'sst/node/config';
import * as lambda from 'aws-lambda';

const serviceName = Config.serviceName;

export const tracer = new Tracer({
  serviceName,
  captureHTTPsRequests: true,
});

export const logger = new Logger({
  serviceName,
});

export function withTracer<T, U>(cb: (event: T, context: lambda.Context) => Promise<U>) {
  const instance = new TracingWrapper(cb);
  return instance.handler.bind(instance);
}

class TracingWrapper<T, U> {
  constructor(private cb: (event: T, context: lambda.Context) => Promise<U>) {
  }

  @tracer.captureLambdaHandler()
  async handler(event: T, context: lambda.Context): Promise<U> {
    return this.cb(event, context);
  }
}