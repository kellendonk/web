import { procedure, router } from './trpc';
import z from 'zod';
import { GuestBook } from './guestbook/GuestBook';
import { Signature$, SignatureImage$ } from './guestbook/schema';

export const guestBook = router({
  getSignatures: procedure
    .input(z.object({
      guestbook: z.string(),
      cursor: z.optional(z.string()),
    }))
    .output(z.object({
      signatures: z.array(Signature$),
      cursor: z.optional(z.string()),
    }))
    .query(async ({ input }) => {
      const subject = new GuestBook(input.guestbook);
      const resp = await subject.getSignatures(input.cursor);

      return {
        signatures: resp.signatures,
        cursor: resp.cursor ? resp.cursor : undefined,
      };
    }),

  addSignature: procedure
    .input(z.object({
      guestbook: z.string(),
      image: SignatureImage$,
    }))
    .output(z.object({
      guestbook: z.string(),
      id: z.string(),
    }))
    .mutation(async ({ input }) => {
      const subject = new GuestBook(input.guestbook);

      const resp = await subject.addSignature({
        width: input.image.width,
        height: input.image.height,
        lines: input.image.lines.map((line) => ({
          brushColor: line.brushColor,
          brushRadius: line.brushRadius,
          points: line.points.map((point) => ({
            x: point.x,
            y: point.y,
          })),
        })),
      });

      return {
        guestbook: resp.guestbook,
        id: resp.id,
      };
    }),
});
