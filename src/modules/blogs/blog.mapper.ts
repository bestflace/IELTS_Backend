function mapTag(tag: { id: string; name: string; slug: string }) {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  };
}

export function mapBlog(blog: any) {
  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    contentMarkdown: blog.content_markdown,
    coverImageUrl: blog.cover_image_url,
    status: blog.status,
    publishedAt: blog.published_at,
    createdBy: blog.created_by,
    createdAt: blog.created_at,
    updatedAt: blog.updated_at,
    tags: (blog.blog_tags ?? []).map((item: any) => mapTag(item.tags)),
  };
}

export function mapBlogList(blog: any) {
  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    coverImageUrl: blog.cover_image_url,
    status: blog.status,
    publishedAt: blog.published_at,
    createdAt: blog.created_at,
    updatedAt: blog.updated_at,
    tags: (blog.blog_tags ?? []).map((item: any) => mapTag(item.tags)),
  };
}
