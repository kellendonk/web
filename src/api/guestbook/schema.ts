import z from 'zod';

export const SignatureImage$ = z.object({
  width: z.number(),
  height: z.number(),
  lines: z.array(z.object({
    brushColor: z.string(),
    brushRadius: z.number(),
    points: z.array(z.object({
      x: z.number(),
      y: z.number(),
    })),
  })),
});

export const Signature$ = z.object({
  id: z.string(),
  signedTime: z.number(),
  image: SignatureImage$,
});

export interface Signature {
  id: string;
  signedTime: number;
  image: SignatureImage;
}

export interface SignatureImage {
  width: number;
  height: number;
  lines: Array<SignatureLine>;
}

export interface SignatureLine {
  brushColor: string;
  brushRadius: number;
  points: Array<{ x: number; y: number }>;
}