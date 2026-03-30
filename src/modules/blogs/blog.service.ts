import { blog_status } from "@prisma/client";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../common/utils/pagination";
import { mapBlog, mapBlogList } from "./blog.mapper";
import { blogRepository } from "./blog.repository";

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeNullableText(
  value?: string | null,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return normalizeText(value);
}

function uniqueTagIds(tagIds?: string[]) {
  return Array.from(new Set(tagIds ?? []));
}

function slugifyText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

async function assertTagsExist(tagIds?: string[]) {
  const ids = uniqueTagIds(tagIds);
  if (ids.length === 0) return ids;

  const count = await blogRepository.countTagsByIds(ids);
  if (count !== ids.length) {
    throw new BadRequestError(MESSAGE.BLOG.TAG_NOT_FOUND);
  }

  return ids;
}

async function generateUniqueSlug(title: string, currentId?: string) {
  const base = slugifyText(title) || "blog";
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await blogRepository.findBySlug(slug);
    if (!existing || existing.id === currentId) {
      return slug;
    }
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

export const blogService = {
  async getPublicBlogs(query: {
    page?: number;
    limit?: number;
    search?: string;
    tagIds?: string[];
  }) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      blogRepository.findPublicList({
        skip: pagination.skip,
        take: pagination.limit,
        search: query.search?.trim() || undefined,
        tagIds: query.tagIds,
      }),
      blogRepository.countPublicList({
        search: query.search?.trim() || undefined,
        tagIds: query.tagIds,
      }),
    ]);

    return {
      items: items.map(mapBlogList),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getPublicBlogBySlug(slug: string) {
    const blog = await blogRepository.findBySlug(slug);

    if (!blog || blog.status !== blog_status.PUBLISHED) {
      throw new NotFoundError(MESSAGE.BLOG.NOT_FOUND);
    }

    return mapBlog(blog);
  },

  async getAdminBlogs(query: {
    page?: number;
    limit?: number;
    search?: string;
    tagIds?: string[];
    status?: string;
  }) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      blogRepository.findAdminList({
        skip: pagination.skip,
        take: pagination.limit,
        search: query.search?.trim() || undefined,
        tagIds: query.tagIds,
        status: query.status as blog_status | undefined,
      }),
      blogRepository.countAdminList({
        search: query.search?.trim() || undefined,
        tagIds: query.tagIds,
        status: query.status as blog_status | undefined,
      }),
    ]);

    return {
      items: items.map(mapBlogList),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getAdminBlogById(id: string) {
    const blog = await blogRepository.findById(id);

    if (!blog) {
      throw new NotFoundError(MESSAGE.BLOG.NOT_FOUND);
    }

    return mapBlog(blog);
  },

  async createBlog(
    userId: string,
    body: {
      title: string;
      excerpt?: string | null;
      contentMarkdown: string;
      coverImageUrl?: string | null;
      tagIds?: string[];
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    },
  ) {
    const tagIds = await assertTagsExist(body.tagIds);
    const slug = await generateUniqueSlug(body.title);

    const created = await blogRepository.createBlog({
      title: normalizeText(body.title),
      slug,
      excerpt: normalizeNullableText(body.excerpt),
      content_markdown: body.contentMarkdown.trim(),
      cover_image_url: body.coverImageUrl?.trim() || null,
      status: (body.status as blog_status | undefined) ?? blog_status.DRAFT,
      created_by: userId,
      tagIds,
    });

    return mapBlog(created);
  },

  async updateBlog(
    id: string,
    body: {
      title?: string;
      excerpt?: string | null;
      contentMarkdown?: string;
      coverImageUrl?: string | null;
      tagIds?: string[];
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    },
  ) {
    const existing = await blogRepository.findById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.BLOG.NOT_FOUND);
    }

    const tagIds =
      body.tagIds !== undefined
        ? await assertTagsExist(body.tagIds)
        : undefined;
    const slug = body.title
      ? await generateUniqueSlug(body.title, id)
      : undefined;

    const updated = await blogRepository.updateBlog(id, {
      ...(body.title !== undefined
        ? { title: normalizeText(body.title), slug }
        : {}),
      ...(body.excerpt !== undefined
        ? { excerpt: normalizeNullableText(body.excerpt) }
        : {}),
      ...(body.contentMarkdown !== undefined
        ? { content_markdown: body.contentMarkdown.trim() }
        : {}),
      ...(body.coverImageUrl !== undefined
        ? { cover_image_url: body.coverImageUrl?.trim() || null }
        : {}),
      ...(body.status !== undefined
        ? { status: body.status as blog_status }
        : {}),
      ...(tagIds !== undefined ? { tagIds } : {}),
    });

    return mapBlog(updated);
  },

  async deleteBlog(id: string) {
    const existing = await blogRepository.findById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.BLOG.NOT_FOUND);
    }

    await blogRepository.deleteBlog(id);

    return { success: true };
  },

  async publishBlog(id: string) {
    const existing = await blogRepository.findById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.BLOG.NOT_FOUND);
    }

    const published = await blogRepository.publishBlog(id);
    return mapBlog(published);
  },

  async unpublishBlog(id: string) {
    const existing = await blogRepository.findById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.BLOG.NOT_FOUND);
    }

    const unpublished = await blogRepository.unpublishBlog(id);
    return mapBlog(unpublished);
  },
};
