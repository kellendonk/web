import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { BlogData, BlogDataNotFoundError } from '../../../util/blog';
import { getQueryParam } from '../../../util/get-query-param';
import BlogPostPage, { BlogPostPageProps } from '../posts/[slug]';

export default BlogPostPage;

export async function getServerSideProps(
  context: GetServerSidePropsContext,
): Promise<GetServerSidePropsResult<BlogPostPageProps>> {
  const postIdStr = getQueryParam(context.params, 'postId');
  const postId = parseInt(postIdStr);

  if (isNaN(postId)) {
    return {
      notFound: true,
    };
  }

  try {
    const post = await BlogData.instance().getPreviewById(postId);
    return {
      props: { post },
    };
  } catch (e) {
    if (e instanceof BlogDataNotFoundError) {
      return {
        notFound: true,
      };
    }

    throw e;
  }
}
