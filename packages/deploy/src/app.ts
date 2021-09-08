#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import 'source-map-support/register';
import { CdkCrcStage } from './cdk-crc-stage';
import { Pipeline } from './pipeline';

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const DOMAIN_NAME = 'kellendonk.ca';
const DOMAIN_HOSTED_ZONE_ID_PARAM = `/${DOMAIN_NAME}/hosted-zone-id`;
const DOMAIN_CERTIFICATE_ARN = `/${DOMAIN_NAME}/certificate-arn`;

const app = new cdk.App();

// Development environment.
new CdkCrcStage(app, 'CdkCrc-Dev', {
  env,
  domainConfig: {
    certificateParameter: DOMAIN_CERTIFICATE_ARN,
    domainNames: [`cdk-crc-dev.${DOMAIN_NAME}`],
    domainZoneIdParam: DOMAIN_HOSTED_ZONE_ID_PARAM,
  },
});

// Continuous Delivery pipeline (uses CdkCrcStage)
new Pipeline(app, 'CdkCrc-Pipeline', {
  env,
  domainCertParam: DOMAIN_CERTIFICATE_ARN,
  domainName: DOMAIN_NAME,
  domainZoneIdParam: DOMAIN_HOSTED_ZONE_ID_PARAM,
  pipelineBranch: 'main',
  pipelineConnectionArnParam: '/CdkCrc/pipeline-connection-arn',
  pipelineRepo: 'kellendonk/web',
});
