import { GuestBookData } from './data';
import { EntityItem } from 'electrodb';
import { ulid } from 'ulid';
import { Signature, SignatureImage } from './schema';

export class GuestBook {
  constructor(private readonly id: string) {
  }

  async getSignatures(cursor?: string): Promise<{ signatures: Array<Signature>, cursor?: string }> {
    const resp = await GuestBookData.entities.GuestBookSignature.query
      .main({ guestbook: this.id })
      .go({ cursor, order: 'desc' });

    return {
      cursor: resp.cursor,
      signatures: resp.data.map(dataToDomain),
    };
  }

  async upsertSignature(signature: Signature): Promise<void> {
    await GuestBookData.entities.GuestBookSignature.upsert({
      guestbook: this.id,
      id: signature.id,
      signedTime: signature.signedTime,
      width: signature.image.width,
      height: signature.image.height,
      lines: signature.image.lines,
    }).go();
  }

  async addSignature(image: SignatureImage): Promise<{ guestbook: string, id: string }> {
    const signatureId = ulid();

    await GuestBookData.entities.GuestBookSignature.create({
      guestbook: this.id,
      id: signatureId,
      width: image.width,
      height: image.height,
      lines: image.lines,
    }).go();

    return {
      guestbook: this.id,
      id: signatureId,
    };
  }

  async clearSignatures(): Promise<void> {
    const signatures = await this.getSignatures();

    await Promise.all(
      signatures.signatures.map((signature) =>
        GuestBookData.entities.GuestBookSignature.delete({ guestbook: this.id, id: signature.id }).go(),
      ),
    );
  }
}

function dataToDomain(data: EntityItem<typeof GuestBookData.entities.GuestBookSignature>): Signature {
  return {
    id: data.id,
    signedTime: data.signedTime,
    image: {
      width: data.width,
      height: data.height,
      lines: data.lines.map((line) => ({
        brushColor: line.brushColor,
        brushRadius: line.brushRadius,
        points: line.points.map((point) => ({
          x: point.x,
          y: point.y,
        })),
      })),
    },
  };
}
