import fetch from 'node-fetch';
import { AsyncValueProvider } from './async-value-provider';

export interface BlogPostsOptions {
  readonly accessTokenProvider: AsyncValueProvider<string>;
  readonly wordpressApiBase: string;
}

export class BlogPosts {
  private readonly accessTokenProvider: AsyncValueProvider<string>;
  private readonly wordpressApiBase: string;

  constructor(options: BlogPostsOptions) {
    this.accessTokenProvider = options.accessTokenProvider;
    this.wordpressApiBase = options.wordpressApiBase;
  }

  async getPost(postId: number): Promise<object> {
    const accessToken = await this.accessTokenProvider.provide();

    const url = `${this.wordpressApiBase}posts/${postId}`;
    console.log(`Fetching ${url}`);
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP request not ok: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  }
}
