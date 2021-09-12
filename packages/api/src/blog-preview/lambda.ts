import type * as lambda from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { ensureEnv } from '../ensure-env';
import { AccessTokenProvider } from './access-token-provider';
import { BlogPreviewResponse } from './api';
import { CachedValueProvider } from './async-value-provider';
import { BlogPosts } from './blog-posts';
import * as constants from './constants';
import { SecretJsonProvider } from './secret-json-provider';

const accessTokenProvider = new AccessTokenProvider({
  tokenEndpoint: ensureEnv(constants.ACCESS_TOKEN_ENDPOINT_ENV_NAME),
  oAuth2PasswordSecretProvider: SecretJsonProvider.secretsManager({
    secretsManager: new AWS.SecretsManager(),
    secretId: ensureEnv(constants.OAUTH_TOKEN_SECRET_ID_ENV_NAME),
  }),
});

const cachedAccessTokenProvider = new CachedValueProvider({
  valueProvider: accessTokenProvider,
});

const blogPosts = new BlogPosts({
  accessTokenProvider: cachedAccessTokenProvider,
  wordpressApiBase: ensureEnv(constants.WORDPRESS_API_BASE_ENV_VAR),
});

export async function handler(
  event: lambda.APIGatewayProxyEventV2,
  _context: unknown,
): Promise<lambda.APIGatewayProxyResultV2> {
  try {
    console.log('event =', event);
    const postIdStr = event.pathParameters?.postId ?? '';
    const postId = parseInt(postIdStr);

    if (isNaN(postId)) {
      return {
        statusCode: 400,
        body: 'Invalid postId',
      };
    }

    console.log(`Getting postId ${postId}`);
    const post = await blogPosts.getPost(postId);

    console.log('Post =', post);
    const value: BlogPreviewResponse = {
      postId,
      post,
    };

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(value),
    };
  } catch (e) {
    if (/404/.test(e)) {
      return {
        statusCode: 404,
        body: 'Could not find that post',
      };
    }

    return {
      statusCode: 500,
      body: e.toString(),
    };
  }
}
