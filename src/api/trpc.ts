import { initTRPC } from '@trpc/server';
import { tracer } from './powertools';

const trpc = initTRPC.create();

const tracerMiddleware = trpc.middleware(async (opts) => {
  tracer.putAnnotation('trpc-path', opts.path);
  tracer.putAnnotation('trpc-type', opts.type);

  const start = Date.now();
  const res = await opts.next(opts);

  tracer.putMetadata('trpc.duration', Date.now() - start);

  if (res.ok === true) {
    tracer.putAnnotation('trpc-status', 'ok');
  } else {
    tracer.putAnnotation('trpc-status', 'error');
    tracer.putMetadata('trpc.error', res.error);
  }

  return res;
});

export const procedure = trpc.procedure.use(tracerMiddleware);
export const router = trpc.router;