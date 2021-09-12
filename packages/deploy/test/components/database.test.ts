import { Template } from '@aws-cdk/assertions';
import * as cdk from '@aws-cdk/core';
import { Database } from '../../src/components/database';

test('database is unchanged', () => {
  // GIVEN
  const stack = new cdk.Stack();

  // WHEN
  new Database(stack, 'Database');

  // THEN
  const assert = Template.fromStack(stack);
  assert.hasResource('AWS::DynamoDB::Table', {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      KeySchema: [
        {
          AttributeName: 'PK',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'SK',
          KeyType: 'RANGE',
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'PK',
          AttributeType: 'S',
        },
        {
          AttributeName: 'SK',
          AttributeType: 'S',
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    },
    UpdateReplacePolicy: 'Delete',
    DeletionPolicy: 'Delete',
  });
});
