import fetch from 'node-fetch';
import { AsyncValueProvider } from './async-value-provider';
import {
  OAuth2PasswordSecret,
  SecretJsonProvider,
} from './secret-json-provider';

export interface AccessTokenProviderOptions {
  readonly tokenEndpoint: string;
  readonly oAuth2PasswordSecretProvider: SecretJsonProvider<OAuth2PasswordSecret>;
}

export class AccessTokenProvider implements AsyncValueProvider<string> {
  private readonly tokenEndpoint: string;
  private readonly oAuth2PasswordSecretProvider: SecretJsonProvider<OAuth2PasswordSecret>;

  constructor(options: AccessTokenProviderOptions) {
    this.tokenEndpoint = options.tokenEndpoint;
    this.oAuth2PasswordSecretProvider = options.oAuth2PasswordSecretProvider;
  }

  async provide(): Promise<string> {
    const oauth2PasswordSecret =
      await this.oAuth2PasswordSecretProvider.provide();

    // Create an OAuth2 password grant request
    const res = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: [
        `grant_type=password`,
        `username=${encodeURIComponent(oauth2PasswordSecret.username)}`,
        `password=${encodeURIComponent(oauth2PasswordSecret.password)}`,
        `client_id=${encodeURIComponent(oauth2PasswordSecret.clientId)}`,
        `client_secret=${encodeURIComponent(
          oauth2PasswordSecret.clientSecret,
        )}`,
      ].join('&'),
    });

    const resJson = await res.json();
    return resJson.access_token;
  }
}
