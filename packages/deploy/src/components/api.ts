import * as apigwv2 from '@aws-cdk/aws-apigatewayv2';
import * as apigwv2_integrations from '@aws-cdk/aws-apigatewayv2-integrations';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as cloudfront_origins from '@aws-cdk/aws-cloudfront-origins';
import * as lambda from '@aws-cdk/aws-lambda';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as cdk from '@aws-cdk/core';
import * as api from 'api';
import * as path from 'path';
import { PACKAGES_BASE } from '../constants';
import { ICdnBehaviorOptions } from './cdn';
import {
  CrossRegionStringValueProps,
  CrossRegionValue,
} from './cross-region-value';
import { Database } from './database';

/** Props for `Api` */
export interface ApiProps {
  /** The database for the API */
  readonly database: Database;
}

/** Create an HTTP API */
export class Api extends cdk.Construct implements ICdnBehaviorOptions {
  /** The produced API Gateway */
  public readonly httpApi: apigwv2.HttpApi;

  private httpApiDomainName: CrossRegionValue<
    string,
    CrossRegionStringValueProps
  >;

  constructor(scope: cdk.Construct, id: string, props: ApiProps) {
    super(scope, id);

    this.httpApi = new apigwv2.HttpApi(this, 'HttpApi', {
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        maxAge: cdk.Duration.days(10),
      },
    });

    const visitsHandler = new lambda.Function(this, 'Handler', {
      code: lambda.Code.fromAsset(API_FUNCTIONS_BASE),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'visit-counter.handler',
      environment: {
        [api.FUNCTION_DATABASE_ENV_NAME]: props.database.table.tableName,
      },
    });

    props.database.table.grantReadWriteData(visitsHandler);

    new apigwv2.HttpRoute(this, 'Visits', {
      httpApi: this.httpApi,
      routeKey: apigwv2.HttpRouteKey.with('/api/visits'),
      integration: new apigwv2_integrations.LambdaProxyIntegration({
        handler: visitsHandler,
      }),
    });

    const secret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'secret',
      'wordpress.com/JoshKellendonkBot',
    );
    const blogPreviewHandler = new lambda.Function(this, 'BlogPreviewHandler', {
      code: lambda.Code.fromAsset(API_FUNCTIONS_BASE),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'blog-preview.handler',
      environment: {
        [api.OAUTH_TOKEN_SECRET_ID_ENV_NAME]: secret.secretName,
        [api.ACCESS_TOKEN_ENDPOINT_ENV_NAME]:
          'https://public-api.wordpress.com/oauth2/token',
        [api.WORDPRESS_API_BASE_ENV_VAR]:
          'https://public-api.wordpress.com/wp/v2/sites/joshkellendonk.wordpress.com/',
      },
    });
    secret.grantRead(blogPreviewHandler);

    new apigwv2.HttpRoute(this, 'BlogPreview', {
      httpApi: this.httpApi,
      routeKey: apigwv2.HttpRouteKey.with('/api/blog-preview/{postId}'),
      integration: new apigwv2_integrations.LambdaProxyIntegration({
        handler: blogPreviewHandler,
        payloadFormatVersion: apigwv2.PayloadFormatVersion.VERSION_2_0,
      }),
    });

    const httpApiDomainName = renderExecuteApiDomain(this.httpApi);
    this.httpApiDomainName = CrossRegionValue.fromString(
      this,
      'HttpApiDomainName',
      httpApiDomainName,
    );
  }

  cdnBehaviorOptions(scope: cdk.Construct): cloudfront.BehaviorOptions {
    const httpApiDomainName = this.httpApiDomainName.getValueInScope(
      scope,
      'HttpApiDomainName',
    );

    return {
      origin: new cloudfront_origins.HttpOrigin(httpApiDomainName),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
    };
  }
}

/**
 * Renders the execute-api domain name for the http api.
 * @param httpApi
 */
function renderExecuteApiDomain(httpApi: apigwv2.HttpApi) {
  return cdk.Fn.join('', [
    httpApi.httpApiId,
    '.execute-api.',
    cdk.Stack.of(httpApi).region,
    '.amazonaws.com',
  ]);
}

const API_FUNCTIONS_BASE = path.join(PACKAGES_BASE, 'api', 'functions');
