import * as cdk from '@aws-cdk/core';
import * as sls_next from '@rayova/cdk-serverless-nextjs';
import * as path from 'path';
import { Api } from './components/api';
import { Cdn } from './components/cdn';
import { Database } from './components/database';
import { Dns } from './components/dns';
import { DomainConfig } from './components/domain-config';
import { PACKAGES_BASE } from './constants';
import { TestStack } from './stacks/test-stack';

/**
 * Props for `CdkCrcStage`
 */
export interface CdkCrcStageProps extends cdk.StageProps {
  /** Optional domain configuration. */
  readonly domainConfig?: DomainConfig;
}

/**
 * A CRC deployment stage with all resources for the environment.
 */
export class CdkCrcStage extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props: CdkCrcStageProps = {}) {
    super(scope, id, props);

    const regionalStackProps: cdk.StackProps = {
      env: {
        account: this.account,
        region: this.region,
      },
    };

    // Stateful resources:
    const regionalStatefulStack = new cdk.Stack(
      this,
      'RegionalStateful',
      regionalStackProps,
    );
    const database = new Database(regionalStatefulStack, 'Database');

    // Stateless resources:
    const regionalStatelessStack = new cdk.Stack(
      this,
      'RegionalStateless',
      regionalStackProps,
    );
    const regionalApi = new Api(regionalStatelessStack, 'Api', {
      database,
    });

    // Edge/L@E resources in us-east-1
    const edgeEnv = { region: 'us-east-1' };
    const edge = new cdk.Stack(this, 'Edge', {
      env: edgeEnv,
    });

    const serverlessNextjs = new sls_next.ServerlessNextjs(edge, 'Nextjs', {
      nextjsArtifact: sls_next.NextjsArtifact.fromBuild({
        nextjsDirectory: path.join(PACKAGES_BASE, 'frontend'),
        buildCommand: ['yarn', 'next', 'build'],
      }),
    });

    const cdn = new Cdn(edge, 'Cdn', {
      domainConfig: props.domainConfig,
      defaultBehavior: serverlessNextjs.cloudFrontConfig.defaultBehavior,
      additionalBehaviors: {
        ...serverlessNextjs.cloudFrontConfig.additionalBehaviors,
        '/api/*': regionalApi.cdnBehaviorOptions(edge),
      },
    });

    // Configure DNS
    const dns = new Dns(edge, 'Dns', {
      cdn: cdn,
      domainConfig: props.domainConfig,
    });

    // Add a stack with testing features
    const testStack = new TestStack(this, 'TestStack', {
      env: edgeEnv,
      mainDomain: dns.mainDomain,
    });
    // Add explicit dependencies on all the other stacks so the test stack runs
    // last.
    testStack.addDependency(regionalStatefulStack);
    testStack.addDependency(regionalStatelessStack);
    testStack.addDependency(edge);
  }
}
