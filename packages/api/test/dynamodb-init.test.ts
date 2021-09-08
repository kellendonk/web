import { getDynamoDB } from './dynamodb-init';

const TEST_TABLE_NAME = 'TEST_TABLE';

test('setupTable', async () => {
  const dynamoDB = getDynamoDB();
  const tables = await dynamoDB.listTables().promise();
  expect(tables.TableNames).toEqual(expect.arrayContaining([TEST_TABLE_NAME]));

  const items = await dynamoDB
    .scan({
      TableName: TEST_TABLE_NAME,
    })
    .promise();

  expect(items.Items?.length).toEqual(0);
}, 30000);
