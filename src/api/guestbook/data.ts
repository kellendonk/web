import { Entity, Service } from 'electrodb';
import { Table } from 'sst/node/table';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ulid } from 'ulid';

export const GuestBookSignature = new Entity({
  model: {
    service: 'guestbook',
    entity: 'GuestBookSignature',
    version: '1',
  },
  attributes: {
    guestbook: { type: 'string', required: true },
    id: { type: 'string', required: true, default: () => ulid() },
    signedTime: { type: 'number', required: true, default: () => Date.now() },
    width: { type: 'number', required: true },
    height: { type: 'number', required: true },
    lines: {
      type: 'list',
      required: true,
      items: {
        type: 'map',
        properties: {
          brushColor: { type: 'string', required: true },
          brushRadius: { type: 'number', required: true },
          points: {
            type: 'list',
            items: {
              type: 'map',
              properties: {
                x: { type: 'number', required: true },
                y: { type: 'number', required: true },
              },
            },
          },
        },
      },
    },
  },
  indexes: {
    main: {
      pk: {
        field: 'pk',
        composite: ['guestbook'],
      },
      sk: {
        field: 'sk',
        composite: ['id'],
      },
    },
  },
});

export const GuestBookData = new Service({
  GuestBookSignature,
}, {
  table: Table.GuestBook.tableName,
  client: DynamoDBDocumentClient.from(new DynamoDBClient()),
});