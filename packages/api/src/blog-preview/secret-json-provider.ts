import * as AWS from 'aws-sdk';

export abstract class SecretJsonProvider<T> {
  static secretsManager<T>(
    options: SecretsManagerProviderOptions,
  ): SecretJsonProvider<T> {
    return new SecretsManagerProvider<T>(options);
  }

  static value<T>(secretJson: T): SecretJsonProvider<T> {
    return {
      provide: async () => secretJson,
    };
  }

  abstract provide(): Promise<T>;
}

export interface SecretsManagerProviderOptions {
  readonly secretsManager: AWS.SecretsManager;
  readonly secretId: string;
}

class SecretsManagerProvider<T> extends SecretJsonProvider<T> {
  private readonly secretsManager: AWS.SecretsManager;
  private readonly secretId: string;

  constructor(options: SecretsManagerProviderOptions) {
    super();
    this.secretsManager = options.secretsManager;
    this.secretId = options.secretId;
  }

  async provide(): Promise<T> {
    const secretValue = await this.secretsManager
      .getSecretValue({
        SecretId: this.secretId,
      })
      .promise();

    return JSON.parse(secretValue.SecretString!);
  }
}

export interface OAuth2PasswordSecret {
  readonly username: string;
  readonly password: string;
  readonly clientId: string;
  readonly clientSecret: string;
}
