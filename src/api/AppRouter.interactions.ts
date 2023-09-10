import { procedure, router } from './trpc';
import z from 'zod';
import { Subject } from './interactions/Subject';

export const interactions = router({
  get: procedure
    .input(z.object({ subject: z.string() }))
    .output(z.object({
      subject: z.string(),
      interactions: z.array(z.object({
        type: z.string(),
        count: z.number(),
      })),
    }))
    .query(async (opts) => {
      const subject = new Subject(opts.input.subject);
      const interactions = await subject.getInteractions();

      return {
        subject: opts.input.subject,
        interactions: interactions.map((item) => ({
          type: item.type,
          count: item.count,
        })),
      };
    }),
  addInteraction:
    procedure
      .input(z.object({
        subject: z.string(),
        type: z.string(),
      }))
      .output(z.object({
        subject: z.string(),
        type: z.string(),
        count: z.number(),
      }))
      .mutation(async (opts) => {
        const subject = new Subject(opts.input.subject);

        const resp = await subject.addInteraction(opts.input.type);

        return {
          subject: resp.id,
          type: resp.type,
          count: resp.count,
        };
      }),
});
