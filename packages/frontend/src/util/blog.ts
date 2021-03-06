import { BlogPreviewResponse } from '../../../api/src/blog-preview';

export function getBlogHref(item) {
  return `/blog/posts/${item.slug}`;
}

interface BlogDataOptions {
  /** WP API Base URL */
  readonly apiBaseUrl: string;
  /** Preview API Base URL */
  readonly previewApiBaseUrl: string;
}

/** Access to the blog data */
export class BlogData {
  static instance(): BlogData {
    return new BlogData({
      apiBaseUrl:
        'https://public-api.wordpress.com/wp/v2/sites/joshkellendonk.wordpress.com/',
      previewApiBaseUrl: 'https://www.kellendonk.ca/api/blog-preview/',
    });
  }

  private readonly apiBaseUrl: string;
  private readonly previewApiBaseUrl: string;

  constructor(options: BlogDataOptions) {
    this.apiBaseUrl = options.apiBaseUrl;
    this.previewApiBaseUrl = options.previewApiBaseUrl;
  }

  async getIndexResult(page: number): Promise<BlogIndexResult> {
    const res = await fetch(`${this.apiBaseUrl}posts?page=${page}`);

    // @see https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/
    const totalPages = parseInt(res.headers.get('X-WP-TotalPages'));
    const totalPosts = parseInt(res.headers.get('X-WP-Total'));

    let posts: BlogPost[];
    if (totalPosts === 0) {
      posts = [];
    } else {
      const postsJson = await res.json();
      posts = postsJson.map(mapPostToBlogIndexItem);
    }

    return {
      posts,
      page,
      totalPages,
      totalPosts,
    };
  }

  async getPreviewById(postId: number): Promise<BlogPost> {
    const res = await fetch(`${this.previewApiBaseUrl}${postId}`);
    const post: BlogPreviewResponse = await res.json();
    if (post.postId !== postId) {
      throw new BlogDataNotFoundError();
    }

    return mapPostToBlogIndexItem(post.post);
  }

  async getPostBySlug(slug: string): Promise<BlogPost> {
    const res = await fetch(`${this.apiBaseUrl}posts?slug=${slug}`);
    const totalPosts = parseInt(res.headers.get('X-WP-Total'));

    if (totalPosts === 0) {
      throw new BlogDataNotFoundError();
    }

    try {
      const posts = await res.json();
      return posts.map(mapPostToBlogIndexItem)[0];
    } catch (e) {
      console.error(e);
      throw new BlogDataNotFoundError();
    }
  }
}

export class BlogDataNotFoundError extends Error {}

export interface BlogIndexResult {
  readonly page: number;
  readonly posts: BlogPost[];
  readonly totalPages: number;
  readonly totalPosts: number;
}

export interface BlogPost {
  readonly slug: string;
  readonly author: string;
  readonly title: string;
  readonly date: string;
  readonly excerpt: string;
  readonly content: string;
  readonly featuredImageUrl?: string;
}

export function mapPostToBlogIndexItem(post: any): BlogPost {
  return {
    slug: post.slug,
    title: post.title.rendered,
    author: 'Josh Kellendonk',
    date: post.date_gmt,
    excerpt: post.excerpt.rendered,
    content: post.content.rendered,
    featuredImageUrl: post.jetpack_featured_media_url,
  };
}

export function getBlogIndexPageHref(page: number) {
  return page > 1 ? `/blog/${page}` : '/blog';
}

export function getBlogPostHref(post: BlogPost) {
  return `/blog/posts/${post.slug}`;
}

/**
 * Amount of seconds after which a blog page can be incrementally regenerated
 */
export const BLOG_REVALIDATION_SECONDS = 10;
