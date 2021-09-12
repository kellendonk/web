import {AccessTokenProvider} from "./access-token-provider";
import fetch from "node-fetch";

export interface BlogPostPreviewOptions {
  readonly accessTokenProvider: AccessTokenProvider;
  readonly wordpressApiBase: string;
}

export class BlogPostPreview {
  private readonly accessTokenProvider: AccessTokenProvider;
  private readonly wordpressApiBase: string;

  constructor(options: BlogPostPreviewOptions) {
    this.accessTokenProvider = options.accessTokenProvider;
    this.wordpressApiBase = options.wordpressApiBase;
  }

  async getPost(postId: number): Promise<object> {
    const accessToken = await this.accessTokenProvider.provide();

    const res = await fetch(`${this.wordpressApiBase}posts/${postId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Not ok! ${res.status} ${res.statusText}`);
    }

    return await res.json();
  }
}