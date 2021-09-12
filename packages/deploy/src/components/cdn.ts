import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as ssm from '@aws-cdk/aws-ssm';
import * as cdk from '@aws-cdk/core';
import { DomainConfig } from './domain-config';

/** Props for `Cdn` */
export interface CdnProps {
  /** Default behavior */
  readonly defaultBehavior: cloudfront.BehaviorOptions;

  /** Additional behaviors */
  readonly additionalBehaviors?: Record<string, cloudfront.BehaviorOptions>;

  /** Optional domain configuration */
  readonly domainConfig?: DomainConfig;
}

/** Create a CloudFront distribution exposing the static site and the API */
export class Cdn extends cdk.Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: cdk.Construct, id: string, props: CdnProps) {
    super(scope, id);

    const domainNameConfigs = this.renderDistributionDomainConfig(
      props.domainConfig,
    );

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: props.defaultBehavior,
      additionalBehaviors: props.additionalBehaviors,

      // Reduce the cost
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,

      // Configure the certificate & domain names if available.
      ...domainNameConfigs,
    });
  }

  private renderDistributionDomainConfig(domainConfig?: DomainConfig) {
    if (!domainConfig) {
      return {};
    }

    const certificateArnParameter = ssm.StringParameter.fromStringParameterName(
      this,
      'CertificateArn',
      domainConfig.certificateParameter,
    );
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Certificate',
      certificateArnParameter.stringValue,
    );

    return {
      certificate,
      domainNames: domainConfig?.domainNames,
    };
  }
}

/** Behavior options provider, especially in a remote region stack */
export interface ICdnBehaviorOptions {
  /** Provide behavior options */
  cdnBehaviorOptions(scope: cdk.Construct): cloudfront.BehaviorOptions;
}
