import { GetObjectCommand, ListObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import { GuestBook } from './GuestBook';
import { Signature, SignatureImage$ } from './schema';
import { convertToNative } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import z from 'zod';
import { ulid } from 'ulid';
import { Readable } from 'stream';

const s3Client = new S3Client({});

type Params = {
  bucketName: string;
  keyPrefix: string;
}

export async function main(event: { params: Params }) {
  const signatures = getSignatures(event.params);

  for await (const signature of signatures) {
    const guestBook = new GuestBook(signature.guestbook);
    await guestBook.upsertSignature(signature.signature);
  }
}

async function* getSignatures(params: Params) {
  const dumpFileList = await s3Client.send(new ListObjectsCommand({
    Bucket: params.bucketName,
    Prefix: params.keyPrefix,
  }));

  const keys = (dumpFileList.Contents ?? []).flatMap((object) =>
    /data\/\d+\.json$/.test(object.Key) ? object.Key : []);

  for (const key of keys) {
    const dumpFile = await s3Client.send(new GetObjectCommand({
      Bucket: params.bucketName,
      Key: key,
    }));

    const contents = await streamToString(dumpFile.Body as Readable);
    console.log(`${key} contents: ${contents}`);

    yield* parseDumpFile(contents);
  }
}

// https://github.com/aws/aws-sdk-js-v3/issues/1877#issuecomment-755430937
async function streamToString (stream: Readable): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

export function parseDumpFile(str: string): Array<{ guestbook: string, signature: Signature }> {
  const data = JSON.parse(str);

  return data.Items
    .map((item) =>
      Object.fromEntries(
        Object.entries(item)
          .map(([key, value]) =>
            [key, convertToNative(value as AttributeValue)]),
      ),
    )
    .filter(item => item.action === 'Mutation.addGuestBookSignature')
    .flatMap(item => {
      const Item$ = z.object({
        timestamp: z.string(),
        arguments: z.object({
          subject: z.string(),
          image: SignatureImage$,
        }),
      });

      const data = Item$.parse(item);
      const timestamp = new Date(data.timestamp);

      return [{
        guestbook: data.arguments.subject,
        signature: {
          id: ulid(timestamp.getTime()),
          signedTime: timestamp.getTime(),
          image: {
            width: data.arguments.image.width,
            height: data.arguments.image.height,
            lines: data.arguments.image.lines.map((line) => ({
              brushColor: line.brushColor,
              brushRadius: line.brushRadius,
              points: line.points.map((point) => ({
                x: point.x,
                y: point.y,
              })),
            })),
          },
        },
      }];
    });
}
