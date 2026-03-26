import { MESSAGE } from "../../common/constants/message.constant";
import { ConflictError } from "../../common/errors/conflict.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import { slugify } from "../../common/utils/slugify";
import { tagRepository } from "./tag.repository";

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function mapTag(tag: {
  id: string;
  name: string;
  slug: string;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    createdAt: tag.created_at,
    updatedAt: tag.updated_at,
  };
}

export const tagService = {
  async getTags(query: { search?: string }) {
    const tags = await tagRepository.findMany(query.search?.trim());

    return tags.map(mapTag);
  },

  async createTag(body: { name: string; slug?: string }) {
    const normalizedName = normalizeName(body.name);
    const normalizedSlug = (
      body.slug?.trim().toLowerCase() || slugify(normalizedName)
    ).trim();

    const existingByName = await tagRepository.findByName(normalizedName);
    if (existingByName) {
      throw new ConflictError(MESSAGE.TAG.NAME_EXISTS);
    }

    const existingBySlug = await tagRepository.findBySlug(normalizedSlug);
    if (existingBySlug) {
      throw new ConflictError(MESSAGE.TAG.SLUG_EXISTS);
    }

    const created = await tagRepository.create({
      name: normalizedName,
      slug: normalizedSlug,
    });

    return mapTag(created);
  },

  async updateTag(id: string, body: { name?: string; slug?: string }) {
    const existing = await tagRepository.findById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.TAG.NOT_FOUND);
    }

    const nextName =
      body.name !== undefined ? normalizeName(body.name) : existing.name;

    const nextSlug =
      body.slug !== undefined
        ? body.slug.trim().toLowerCase()
        : body.name !== undefined
          ? slugify(nextName)
          : existing.slug;

    const existingByName = await tagRepository.findByName(nextName, id);
    if (existingByName) {
      throw new ConflictError(MESSAGE.TAG.NAME_EXISTS);
    }

    const existingBySlug = await tagRepository.findBySlug(nextSlug, id);
    if (existingBySlug) {
      throw new ConflictError(MESSAGE.TAG.SLUG_EXISTS);
    }

    const updated = await tagRepository.update(id, {
      ...(body.name !== undefined ? { name: nextName } : {}),
      ...(body.slug !== undefined || body.name !== undefined
        ? { slug: nextSlug }
        : {}),
    });

    return mapTag(updated);
  },

  async deleteTag(id: string) {
    const existing = await tagRepository.findById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.TAG.NOT_FOUND);
    }

    const usageStats = await tagRepository.getUsageStats(id);

    if (usageStats.total > 0) {
      throw new ConflictError(MESSAGE.TAG.IN_USE, "TAG_IN_USE", usageStats);
    }

    await tagRepository.delete(id);

    return {
      success: true,
    };
  },
};
