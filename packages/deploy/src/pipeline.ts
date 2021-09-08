import { StringParameter } from '@aws-cdk/aws-ssm';
import * as cdk from '@aws-cdk/core';
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from '@aws-cdk/pipelines';
import { CdkCrcStage } from './cdk-crc-stage';

export interface PipelineProps extends cdk.StackProps {
  readonly domainCertParam: string;
  readonly domainName: string;
  readonly domainZoneIdParam: string;
  readonly pipelineConnectionArnParam: string;
  readonly pipelineRepo: string;
  readonly pipelineBranch: string;
}

/**
 * Create a CDK Pipeline from github to production.
 */
export class Pipeline extends cdk.Stack {
  constructor(app: cdk.Construct, id: string, props: PipelineProps) {
    super(app, id, props);

    // Fetch the Pipeline Connection ARN from SSM
    const pipelineConnectionArnParam = StringParameter.fromStringParameterName(
      this,
      'PipelineConnectionArnParameter',
      props.pipelineConnectionArnParam,
    );

    const pipeline = new CodePipeline(this, 'Pipeline', {
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.connection(
          props.pipelineRepo,
          props.pipelineBranch,
          {
            connectionArn: pipelineConnectionArnParam.stringValue,
          },
        ),
        installCommands: ['bash pipeline-setup.sh'],
        commands: ['yarn build'],
        primaryOutputDirectory: 'packages/deploy/cdk.out',
      }),

      // Allow the pipeline to self-update from git.
      selfMutation: true,

      // Docker is used throughout.
      dockerEnabledForSynth: true,
      dockerEnabledForSelfMutation: true,
    });

    const testStage = new CdkCrcStage(this, 'CdkCrc-Test', {
      env: {
        account: this.account,
        region: this.region,
      },
      domainConfig: {
        certificateParameter: props.domainCertParam,
        domainNames: [`cdk-crc-test.${props.domainName}`],
        domainZoneIdParam: props.domainZoneIdParam,
      },
    });

    const prodStage = new CdkCrcStage(this, 'CdkCrc-Production', {
      env: {
        account: this.account,
        region: this.region,
      },
      domainConfig: {
        certificateParameter: props.domainCertParam,
        domainNames: [`www.${props.domainName}`, props.domainName],
        domainZoneIdParam: props.domainZoneIdParam,
      },
    });

    pipeline.addStage(testStage);
    pipeline.addStage(prodStage, {
      // pre: [
      //   new ManualApprovalStep('Promote to Production', {
      //     comment: `Go to https://cdk-crc-test.${DOMAIN_NAME}/ to test the site.`,
      //   }),
      // ],
    });
  }
}
