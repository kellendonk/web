import { SSTConfig } from 'sst';
import { Api, Cognito, Script, NextjsSite, StackContext, Table, use, Bucket, Config } from 'sst/constructs';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export default {
  config(_input) {
    return {
      name: 'kellendonk',
      region: 'ca-central-1',
    };
  },
  stacks(app) {
    app.stack(Auth);
    app.stack(MigrationData);
    app.stack(Backend);
    app.stack(Web);
  },
} satisfies SSTConfig;

function Auth({ stack }: StackContext) {
  const cognito = new Cognito(stack, 'Cognito', {
    login: ['email'],
    cdk: {
      userPool: {
        removalPolicy: RemovalPolicy.DESTROY,
      },
    },
  });

  return {
    cognito,
    cognitoRegion: stack.region,
  };
}

function MigrationData({ stack }: StackContext) {
  const bucket = new Bucket(stack, 'Bucket', {
    cdk: {
      bucket: {
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        blockPublicAccess: {
          blockPublicAcls: false,
          blockPublicPolicy: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
      },
    },
  });

  const dumpPrefix = 'dump';
  new s3deploy.BucketDeployment(stack, 'Deployment', {
    destinationBucket: bucket.cdk.bucket,
    destinationKeyPrefix: dumpPrefix,
    sources: [s3deploy.Source.asset('dump')],
  });

  return {
    bucket: bucket,
    dumpPrefix,
  };
}

function Backend({ stack }: StackContext) {
  const interactionsTable = new Table(stack, 'Interactions', {
    fields: {
      pk: 'string',
      sk: 'string',
    },
    primaryIndex: {
      partitionKey: 'pk',
      sortKey: 'sk',
    },
    cdk: {
      table: {
        removalPolicy: RemovalPolicy.DESTROY,
      },
    },
  });

  const guestBookTable = new Table(stack, 'GuestBook', {
    fields: {
      pk: 'string',
      sk: 'string',
    },
    primaryIndex: {
      partitionKey: 'pk',
      sortKey: 'sk',
    },
    cdk: {
      table: {
        removalPolicy: RemovalPolicy.DESTROY,
      },
    },
  });

  const serviceName = new Config.Parameter(stack, 'serviceName', {
    value: stack.stackName,
  });

  stack.addDefaultFunctionBinding([interactionsTable, guestBookTable, serviceName]);

  const api = new Api(stack, 'Api', {
    routes: {
      'GET  /{params+}': 'src/api/lambda.handler',
      'POST /{params+}': 'src/api/lambda.handler',
    },
    cors: {
      allowHeaders: ['*'],
      allowOrigins: ['*'],
      allowMethods: ['ANY'],
      maxAge: '1 day',
    },
  });

  stack.addOutputs({
    ApiUrl: api.url,
  });

  const migrationData = use(MigrationData);
  new Script(stack, 'GuestBookImportScript', {
    onCreate: 'src/api/guestbook/import.main',
    onUpdate: 'src/api/guestbook/import.main',
    params: {
      bucketName: migrationData.bucket.bucketName,
      keyPrefix: migrationData.dumpPrefix,
    },
    version: 'v1',
    defaults: {
      function: {
        bind: [migrationData.bucket],
      },
    },
  });

  return {
    api,
  };
}

function Web({ stack, app }: StackContext) {
  const auth = use(Auth);
  const backend = use(Backend);

  const site = new NextjsSite(stack, 'NextWebsite', {
    environment: {
      NEXT_PUBLIC_API_URL: backend.api.url,
      NEXT_PUBLIC_AUTH_USER_POOL_ID: auth.cognito.userPoolId,
      NEXT_PUBLIC_AUTH_USER_POOL_CLIENT_ID: auth.cognito.userPoolClientId,
      NEXT_PUBLIC_AUTH_REGION: auth.cognitoRegion,
    },
    customDomain: {
      domainName: 'kellendonk.ca',
      domainAlias: 'www.kellendonk.ca',
    },
  });

  stack.addOutputs({
    WebUrl: site.url,
  });
}
