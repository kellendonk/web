import type * as lambda from 'aws-lambda';
import {BlogPreviewResponse} from "./api";
import * as AWS from 'aws-sdk';
import {SecretJsonProvider} from './secret-json-provider';
import {AccessTokenProvider} from "./access-token-provider";
import {ensureEnv} from "../ensure-env";
import * as constants from "./constants";
import {BlogPostPreview} from "./blog-post-preview";

const accessTokenProvider = new AccessTokenProvider({
  tokenEndpoint: ensureEnv(constants.ACCESS_TOKEN_ENDPOINT_ENV_NAME),
  oAuth2PasswordSecretProvider: SecretJsonProvider.secretsManager({
    secretsManager: new AWS.SecretsManager(),
    secretId: ensureEnv(constants.OAUTH_TOKEN_SECRET_ID_ENV_NAME),
  }),
});

const blogPostPreview = new BlogPostPreview({
  accessTokenProvider,
  wordpressApiBase: ensureEnv(constants.WORDPRESS_API_BASE_ENV_VAR)
})

export async function handler(
  event: lambda.APIGatewayProxyEventV2,
  _context: unknown,
): Promise<lambda.APIGatewayProxyResultV2> {
  try {
    const postIdStr = event.queryStringParameters?.postId ?? '';
    const postId = parseInt(postIdStr);

    const post = await blogPostPreview.getPost(postId);
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
    }
  } catch (e) {
    if (/404/.test(e)) {
      return {
        statusCode: 404,
        body: 'Could not find that post',
      }
    }

    return {
      statusCode: 500,
      body: e.toString(),
    }
  }
}