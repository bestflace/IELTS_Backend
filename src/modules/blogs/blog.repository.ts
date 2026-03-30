import { Prisma, blog_status } from "@prisma/client";
import { prisma } from "../../config/prisma";

const blogInclude = {
  blog_tags: {
    include: {
      tags: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
} satisfies Prisma.blogsInclude;

export const blogRepository = {
  countTagsByIds(tagIds: string[]) {
    return prisma.tags.count({
      where: {
        id: {
          in: tagIds,
        },
      },
    });
  },

  findById(id: string) {
    return prisma.blogs.findUnique({
      where: { id },
      include: blogInclude,
    });
  },

  findBySlug(slug: string) {
    return prisma.blogs.findUnique({
      where: { slug },
      include: blogInclude,
    });
  },

  findPublicList(params: {
    skip: number;
    take: number;
    search?: string;
    tagIds?: string[];
  }) {
    return prisma.blogs.findMany({
      where: {
        status: blog_status.PUBLISHED,
        ...(params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: "insensitive" } },
                { excerpt: { contains: params.search, mode: "insensitive" } },
                {
                  content_markdown: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(params.tagIds?.length
          ? {
              blog_tags: {
                some: {
                  tag_id: { in: params.tagIds },
                },
              },
            }
          : {}),
      },
      include: blogInclude,
      orderBy: [{ published_at: "desc" }, { created_at: "desc" }],
      skip: params.skip,
      take: params.take,
    });
  },

  countPublicList(params: { search?: string; tagIds?: string[] }) {
    return prisma.blogs.count({
      where: {
        status: blog_status.PUBLISHED,
        ...(params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: "insensitive" } },
                { excerpt: { contains: params.search, mode: "insensitive" } },
                {
                  content_markdown: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(params.tagIds?.length
          ? {
              blog_tags: {
                some: {
                  tag_id: { in: params.tagIds },
                },
              },
            }
          : {}),
      },
    });
  },

  findAdminList(params: {
    skip: number;
    take: number;
    search?: string;
    status?: blog_status;
    tagIds?: string[];
  }) {
    return prisma.blogs.findMany({
      where: {
        ...(params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: "insensitive" } },
                { excerpt: { contains: params.search, mode: "insensitive" } },
                {
                  content_markdown: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.tagIds?.length
          ? {
              blog_tags: {
                some: {
                  tag_id: { in: params.tagIds },
                },
              },
            }
          : {}),
      },
      include: blogInclude,
      orderBy: [{ updated_at: "desc" }],
      skip: params.skip,
      take: params.take,
    });
  },

  countAdminList(params: {
    search?: string;
    status?: blog_status;
    tagIds?: string[];
  }) {
    return prisma.blogs.count({
      where: {
        ...(params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: "insensitive" } },
                { excerpt: { contains: params.search, mode: "insensitive" } },
                {
                  content_markdown: {
                    contains: params.search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(params.status ? { status: params.status } : {}),
        ...(params.tagIds?.length
          ? {
              blog_tags: {
                some: {
                  tag_id: { in: params.tagIds },
                },
              },
            }
          : {}),
      },
    });
  },

  async createBlog(data: {
    title: string;
    slug: string;
    excerpt?: string | null;
    content_markdown: string;
    cover_image_url?: string | null;
    status: blog_status;
    created_by: string;
    tagIds: string[];
  }) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.blogs.create({
        data: {
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt ?? null,
          content_markdown: data.content_markdown,
          cover_image_url: data.cover_image_url ?? null,
          status: data.status,
          created_by: data.created_by,
          published_at:
            data.status === blog_status.PUBLISHED ? new Date() : null,
        },
      });

      if (data.tagIds.length > 0) {
        await tx.blog_tags.createMany({
          data: data.tagIds.map((tagId) => ({
            blog_id: created.id,
            tag_id: tagId,
          })),
        });
      }

      return tx.blogs.findUnique({
        where: { id: created.id },
        include: blogInclude,
      });
    });
  },

  async updateBlog(
    id: string,
    data: {
      title?: string;
      slug?: string;
      excerpt?: string | null;
      content_markdown?: string;
      cover_image_url?: string | null;
      status?: blog_status;
      tagIds?: string[];
    },
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.blogs.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.excerpt !== undefined ? { excerpt: data.excerpt } : {}),
          ...(data.content_markdown !== undefined
            ? { content_markdown: data.content_markdown }
            : {}),
          ...(data.cover_image_url !== undefined
            ? { cover_image_url: data.cover_image_url }
            : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          updated_at: new Date(),
        },
      });

      if (data.tagIds !== undefined) {
        await tx.blog_tags.deleteMany({
          where: { blog_id: id },
        });

        if (data.tagIds.length > 0) {
          await tx.blog_tags.createMany({
            data: data.tagIds.map((tagId) => ({
              blog_id: id,
              tag_id: tagId,
            })),
          });
        }
      }

      return tx.blogs.findUnique({
        where: { id },
        include: blogInclude,
      });
    });
  },

  publishBlog(id: string) {
    return prisma.blogs.update({
      where: { id },
      data: {
        status: blog_status.PUBLISHED,
        published_at: new Date(),
        updated_at: new Date(),
      },
      include: blogInclude,
    });
  },

  unpublishBlog(id: string) {
    return prisma.blogs.update({
      where: { id },
      data: {
        status: blog_status.DRAFT,
        published_at: null,
        updated_at: new Date(),
      },
      include: blogInclude,
    });
  },

  deleteBlog(id: string) {
    return prisma.blogs.delete({
      where: { id },
    });
  },
};
