import { VisitCounter } from '../../src/visit-counter/visit-counter';
import { getDynamoDB, initTable } from '../dynamodb-init';

const TEST_TABLE_NAME = 'TEST_TABLE';

const dynamoDB = getDynamoDB();
beforeEach(async () => {
  await initTable(dynamoDB, TEST_TABLE_NAME);
});

describe('HitCounter.expressionIncrementing', () => {
  test('first hit', async () => {
    // GIVEN
    const hitCounter = VisitCounter.expressionIncrementing({
      tableName: TEST_TABLE_NAME,
      dynamoDB,
    });

    // WHEN
    const hitCount = await hitCounter.visit();

    // THEN
    expect(hitCount).toEqual(1);
  });

  test('second hit', async () => {
    // GIVEN
    const hitCounter = VisitCounter.expressionIncrementing({
      tableName: TEST_TABLE_NAME,
      dynamoDB,
    });

    await hitCounter.visit(); // First hit

    // WHEN
    const hitCount = await hitCounter.visit();

    // THEN
    expect(hitCount).toEqual(2);
  });
});
