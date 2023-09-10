import { Entity, Service } from 'electrodb';
import { Table } from 'sst/node/table';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { tracer } from '../powertools';

export const InteractionCount = new Entity({
  model: {
    service: 'interactions',
    entity: 'InteractionCount',
    version: '1',
  },
  attributes: {
    subject: { type: 'string', required: true },
    type: { type: 'string', required: true },
    count: { type: 'number', required: true, default: 0 },
  },
  indexes: {
    main: {
      pk: {
        field: 'pk',
        composite: ['subject'],
      },
      sk: {
        field: 'sk',
        composite: ['type'],
      },
    },
  },
});

new Service({
  InteractionCount,
}, {
  table: Table.Interactions.tableName,
  client: tracer.captureAWSv3Client(DynamoDBDocumentClient.from(new DynamoDBClient())),
})