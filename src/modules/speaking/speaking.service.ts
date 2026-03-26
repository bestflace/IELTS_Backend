import {
  publish_status,
  speaking_part_type,
  speaking_prompt_type,
} from "@prisma/client";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { ConflictError } from "../../common/errors/conflict.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../common/utils/pagination";
import { mapSpeakingSetDetail, mapSpeakingSetList } from "./speaking.mapper";
import { speakingRepository } from "./speaking.repository";
import {
  CreateSpeakingPartBody,
  CreateSpeakingPromptBody,
  CreateSpeakingPromptItemBody,
  CreateSpeakingSetBody,
  SpeakingSetListQuery,
  UpdateSpeakingPartBody,
  UpdateSpeakingPromptBody,
  UpdateSpeakingPromptItemBody,
  UpdateSpeakingSetBody,
} from "./speaking.types";

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

function uniqueTagIds(tagIds?: string[]): string[] {
  return Array.from(new Set(tagIds ?? []));
}

async function assertTagsExist(tagIds?: string[]) {
  const uniqueIds = uniqueTagIds(tagIds);

  if (uniqueIds.length === 0) return uniqueIds;

  const count = await speakingRepository.countTagsByIds(uniqueIds);

  if (count !== uniqueIds.length) {
    throw new BadRequestError(MESSAGE.SPEAKING.TAG_NOT_FOUND);
  }

  return uniqueIds;
}

function mapSpeakingPart(part: {
  id: string;
  speaking_set_id: string;
  part_type: string;
  title: string | null;
  instructions: string | null;
  recommended_sec: number | null;
  sort_order: number;
  created_at?: Date;
  updated_at?: Date;
  speaking_prompts?: Array<{
    id: string;
    speaking_part_id: string;
    prompt_type: string;
    content: string;
    notes: string | null;
    time_suggest_sec: number | null;
    sort_order: number;
    created_at?: Date;
    updated_at?: Date;
    speaking_prompt_items?: Array<{
      id: string;
      speaking_prompt_id: string;
      item_text: string;
      sort_order: number;
      created_at?: Date;
    }>;
  }>;
}) {
  return {
    id: part.id,
    speakingSetId: part.speaking_set_id,
    partType: part.part_type,
    title: part.title,
    instructions: part.instructions,
    recommendedSec: part.recommended_sec,
    sortOrder: part.sort_order,
    createdAt: part.created_at,
    updatedAt: part.updated_at,
    prompts:
      part.speaking_prompts?.map((prompt) => ({
        id: prompt.id,
        speakingPartId: prompt.speaking_part_id,
        promptType: prompt.prompt_type,
        content: prompt.content,
        notes: prompt.notes,
        timeSuggestSec: prompt.time_suggest_sec,
        sortOrder: prompt.sort_order,
        createdAt: prompt.created_at,
        updatedAt: prompt.updated_at,
        items:
          prompt.speaking_prompt_items?.map((item) => ({
            id: item.id,
            speakingPromptId: item.speaking_prompt_id,
            itemText: item.item_text,
            sortOrder: item.sort_order,
            createdAt: item.created_at,
          })) ?? [],
      })) ?? [],
  };
}

function mapSpeakingPrompt(prompt: {
  id: string;
  speaking_part_id: string;
  prompt_type: string;
  content: string;
  notes: string | null;
  time_suggest_sec: number | null;
  sort_order: number;
  created_at?: Date;
  updated_at?: Date;
  speaking_prompt_items?: Array<{
    id: string;
    speaking_prompt_id: string;
    item_text: string;
    sort_order: number;
    created_at?: Date;
  }>;
}) {
  return {
    id: prompt.id,
    speakingPartId: prompt.speaking_part_id,
    promptType: prompt.prompt_type,
    content: prompt.content,
    notes: prompt.notes,
    timeSuggestSec: prompt.time_suggest_sec,
    sortOrder: prompt.sort_order,
    createdAt: prompt.created_at,
    updatedAt: prompt.updated_at,
    items:
      prompt.speaking_prompt_items?.map((item) => ({
        id: item.id,
        speakingPromptId: item.speaking_prompt_id,
        itemText: item.item_text,
        sortOrder: item.sort_order,
        createdAt: item.created_at,
      })) ?? [],
  };
}

function mapSpeakingPromptItem(item: {
  id: string;
  speaking_prompt_id: string;
  item_text: string;
  sort_order: number;
  created_at: Date;
}) {
  return {
    id: item.id,
    speakingPromptId: item.speaking_prompt_id,
    itemText: item.item_text,
    sortOrder: item.sort_order,
    createdAt: item.created_at,
  };
}

export const speakingService = {
  async getPublicSpeakingSets(query: SpeakingSetListQuery) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      speakingRepository.findPublicSpeakingSets({
        skip: pagination.skip,
        take: pagination.limit,
        search: query.search?.trim() || undefined,
        level: query.level,
        tagIds: query.tagIds,
      }),
      speakingRepository.countPublicSpeakingSets({
        search: query.search?.trim() || undefined,
        level: query.level,
        tagIds: query.tagIds,
      }),
    ]);

    return {
      items: items.map(mapSpeakingSetList),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getPublicSpeakingSetDetail(id: string) {
    const speakingSet =
      await speakingRepository.findPublicSpeakingSetDetail(id);

    if (!speakingSet) {
      throw new NotFoundError(MESSAGE.SPEAKING.SET_NOT_FOUND);
    }

    return mapSpeakingSetDetail(speakingSet);
  },

  async getAdminSpeakingSets(query: SpeakingSetListQuery) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      speakingRepository.findAdminSpeakingSets({
        skip: pagination.skip,
        take: pagination.limit,
        search: query.search?.trim() || undefined,
        level: query.level,
        tagIds: query.tagIds,
        status: query.status as publish_status | undefined,
      }),
      speakingRepository.countAdminSpeakingSets({
        search: query.search?.trim() || undefined,
        level: query.level,
        tagIds: query.tagIds,
        status: query.status as publish_status | undefined,
      }),
    ]);

    return {
      items: items.map(mapSpeakingSetList),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getAdminSpeakingSetDetail(id: string) {
    const speakingSet = await speakingRepository.findAdminSpeakingSetDetail(id);

    if (!speakingSet) {
      throw new NotFoundError(MESSAGE.SPEAKING.SET_NOT_FOUND);
    }

    return mapSpeakingSetDetail(speakingSet);
  },

  async createSpeakingSet(adminUserId: string, body: CreateSpeakingSetBody) {
    const existing = await speakingRepository.findSpeakingSetById(body.id);

    if (existing) {
      throw new ConflictError(MESSAGE.SPEAKING.SET_ID_EXISTS);
    }

    const tagIds = await assertTagsExist(body.tagIds);

    const created = await speakingRepository.createSpeakingSet({
      id: body.id,
      topic: normalizeText(body.topic),
      level: body.level,
      status:
        (body.status as publish_status | undefined) ?? publish_status.DRAFT,
      created_by: adminUserId,
      tagIds,
    });

    return mapSpeakingSetDetail(created!);
  },

  async updateSpeakingSet(id: string, body: UpdateSpeakingSetBody) {
    const existing = await speakingRepository.findSpeakingSetById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.SPEAKING.SET_NOT_FOUND);
    }

    const tagIds =
      body.tagIds !== undefined
        ? await assertTagsExist(body.tagIds)
        : undefined;

    const updated = await speakingRepository.updateSpeakingSet(id, {
      ...(body.topic !== undefined
        ? { topic: normalizeNullableText(body.topic) }
        : {}),
      ...(body.level !== undefined ? { level: body.level } : {}),
      ...(body.status !== undefined
        ? { status: body.status as publish_status }
        : {}),
      ...(tagIds !== undefined ? { tagIds } : {}),
    });

    return mapSpeakingSetDetail(updated!);
  },

  async deleteSpeakingSet(id: string) {
    const existing = await speakingRepository.findSpeakingSetById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.SPEAKING.SET_NOT_FOUND);
    }

    const usageCount =
      await speakingRepository.countTestSectionsUsingSpeakingSet(id);

    if (usageCount > 0) {
      throw new ConflictError(
        MESSAGE.SPEAKING.SET_IN_USE,
        "SPEAKING_SET_IN_USE",
        { testSectionCount: usageCount },
      );
    }

    await speakingRepository.deleteSpeakingSet(id);

    return {
      success: true,
    };
  },

  async publishSpeakingSet(id: string) {
    const speakingSet =
      await speakingRepository.findSpeakingSetStructureForPublish(id);

    if (!speakingSet) {
      throw new NotFoundError(MESSAGE.SPEAKING.SET_NOT_FOUND);
    }

    if (!speakingSet.topic || !speakingSet.topic.trim()) {
      throw new BadRequestError(MESSAGE.SPEAKING.PUBLISH_TOPIC_REQUIRED);
    }

    if (speakingSet.level === null) {
      throw new BadRequestError(MESSAGE.SPEAKING.PUBLISH_LEVEL_REQUIRED);
    }

    if (speakingSet.speaking_parts.length === 0) {
      throw new BadRequestError(MESSAGE.SPEAKING.PUBLISH_PART_REQUIRED);
    }

    for (const part of speakingSet.speaking_parts) {
      if (part.speaking_prompts.length === 0) {
        throw new BadRequestError(
          MESSAGE.SPEAKING.PUBLISH_PROMPT_REQUIRED,
          "SPEAKING_PROMPT_REQUIRED",
          {
            partId: part.id,
            partType: part.part_type,
          },
        );
      }

      for (const prompt of part.speaking_prompts) {
        if (
          prompt.prompt_type === speaking_prompt_type.CUE_CARD &&
          prompt.speaking_prompt_items.length === 0
        ) {
          throw new BadRequestError(
            MESSAGE.SPEAKING.PUBLISH_CUE_CARD_ITEM_REQUIRED,
            "SPEAKING_CUE_CARD_ITEM_REQUIRED",
            {
              promptId: prompt.id,
              partId: part.id,
            },
          );
        }
      }
    }

    const published = await speakingRepository.publishSpeakingSet(id);

    return mapSpeakingSetDetail(published);
  },

  async unpublishSpeakingSet(id: string) {
    const existing = await speakingRepository.findSpeakingSetById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.SPEAKING.SET_NOT_FOUND);
    }

    const unpublished = await speakingRepository.unpublishSpeakingSet(id);

    return mapSpeakingSetDetail(unpublished);
  },

  async createSpeakingPart(
    speakingSetId: string,
    body: CreateSpeakingPartBody,
  ) {
    const speakingSet =
      await speakingRepository.findSpeakingSetById(speakingSetId);

    if (!speakingSet) {
      throw new NotFoundError(MESSAGE.SPEAKING.SET_NOT_FOUND);
    }

    const typeConflict = await speakingRepository.findSpeakingPartByType(
      speakingSetId,
      body.partType as speaking_part_type,
    );

    if (typeConflict) {
      throw new ConflictError(MESSAGE.SPEAKING.PART_TYPE_EXISTS);
    }

    const sortOrderConflict =
      await speakingRepository.findSpeakingPartBySortOrder(
        speakingSetId,
        body.sortOrder,
      );

    if (sortOrderConflict) {
      throw new ConflictError(MESSAGE.SPEAKING.PART_SORT_ORDER_EXISTS);
    }

    const created = await speakingRepository.createSpeakingPart({
      speaking_set_id: speakingSetId,
      part_type: body.partType as speaking_part_type,
      title: normalizeNullableText(body.title),
      instructions: normalizeNullableText(body.instructions),
      recommended_sec: body.recommendedSec ?? null,
      sort_order: body.sortOrder,
    });

    return mapSpeakingPart(created!);
  },

  async updateSpeakingPart(partId: string, body: UpdateSpeakingPartBody) {
    const existing = await speakingRepository.findSpeakingPartById(partId);

    if (!existing) {
      throw new NotFoundError(MESSAGE.SPEAKING.PART_NOT_FOUND);
    }

    if (body.partType !== undefined) {
      const typeConflict = await speakingRepository.findSpeakingPartByType(
        existing.speaking_set_id,
        body.partType as speaking_part_type,
        partId,
      );

      if (typeConflict) {
        throw new ConflictError(MESSAGE.SPEAKING.PART_TYPE_EXISTS);
      }
    }

    if (body.sortOrder !== undefined) {
      const sortOrderConflict =
        await speakingRepository.findSpeakingPartBySortOrder(
          existing.speaking_set_id,
          body.sortOrder,
          partId,
        );

      if (sortOrderConflict) {
        throw new ConflictError(MESSAGE.SPEAKING.PART_SORT_ORDER_EXISTS);
      }
    }

    const updated = await speakingRepository.updateSpeakingPart(partId, {
      ...(body.partType !== undefined
        ? { part_type: body.partType as speaking_part_type }
        : {}),
      ...(body.title !== undefined
        ? { title: normalizeNullableText(body.title) }
        : {}),
      ...(body.instructions !== undefined
        ? { instructions: normalizeNullableText(body.instructions) }
        : {}),
      ...(body.recommendedSec !== undefined
        ? { recommended_sec: body.recommendedSec }
        : {}),
      ...(body.sortOrder !== undefined ? { sort_order: body.sortOrder } : {}),
    });

    return mapSpeakingPart(updated!);
  },

  async deleteSpeakingPart(partId: string) {
    const existing = await speakingRepository.findSpeakingPartById(partId);

    if (!existing) {
      throw new NotFoundError(MESSAGE.SPEAKING.PART_NOT_FOUND);
    }

    await speakingRepository.deleteSpeakingPart(partId);

    return {
      success: true,
    };
  },

  async createSpeakingPrompt(partId: string, body: CreateSpeakingPromptBody) {
    const part = await speakingRepository.findSpeakingPartById(partId);

    if (!part) {
      throw new NotFoundError(MESSAGE.SPEAKING.PART_NOT_FOUND);
    }

    const sortOrderConflict =
      await speakingRepository.findSpeakingPromptBySortOrder(
        partId,
        body.sortOrder,
      );

    if (sortOrderConflict) {
      throw new ConflictError(MESSAGE.SPEAKING.PROMPT_SORT_ORDER_EXISTS);
    }

    const created = await speakingRepository.createSpeakingPrompt({
      speaking_part_id: partId,
      prompt_type: body.promptType as speaking_prompt_type,
      content: normalizeText(body.content),
      notes: normalizeNullableText(body.notes),
      time_suggest_sec: body.timeSuggestSec ?? null,
      sort_order: body.sortOrder,
    });

    return mapSpeakingPrompt(created!);
  },

  async updateSpeakingPrompt(promptId: string, body: UpdateSpeakingPromptBody) {
    const existing = await speakingRepository.findSpeakingPromptById(promptId);

    if (!existing) {
      throw new NotFoundError(MESSAGE.SPEAKING.PROMPT_NOT_FOUND);
    }

    if (body.sortOrder !== undefined) {
      const sortOrderConflict =
        await speakingRepository.findSpeakingPromptBySortOrder(
          existing.speaking_part_id,
          body.sortOrder,
          promptId,
        );

      if (sortOrderConflict) {
        throw new ConflictError(MESSAGE.SPEAKING.PROMPT_SORT_ORDER_EXISTS);
      }
    }

    const updated = await speakingRepository.updateSpeakingPrompt(promptId, {
      ...(body.promptType !== undefined
        ? { prompt_type: body.promptType as speaking_prompt_type }
        : {}),
      ...(body.content !== undefined
        ? { content: normalizeText(body.content) }
        : {}),
      ...(body.notes !== undefined
        ? { notes: normalizeNullableText(body.notes) }
        : {}),
      ...(body.timeSuggestSec !== undefined
        ? { time_suggest_sec: body.timeSuggestSec }
        : {}),
      ...(body.sortOrder !== undefined ? { sort_order: body.sortOrder } : {}),
    });

    return mapSpeakingPrompt(updated!);
  },

  async deleteSpeakingPrompt(promptId: string) {
    const existing = await speakingRepository.findSpeakingPromptById(promptId);

    if (!existing) {
      throw new NotFoundError(MESSAGE.SPEAKING.PROMPT_NOT_FOUND);
    }

    await speakingRepository.deleteSpeakingPrompt(promptId);

    return {
      success: true,
    };
  },

  async createSpeakingPromptItem(
    promptId: string,
    body: CreateSpeakingPromptItemBody,
  ) {
    const prompt = await speakingRepository.findSpeakingPromptById(promptId);

    if (!prompt) {
      throw new NotFoundError(MESSAGE.SPEAKING.PROMPT_NOT_FOUND);
    }

    const sortOrderConflict =
      await speakingRepository.findSpeakingPromptItemBySortOrder(
        promptId,
        body.sortOrder,
      );

    if (sortOrderConflict) {
      throw new ConflictError(MESSAGE.SPEAKING.ITEM_SORT_ORDER_EXISTS);
    }

    const created = await speakingRepository.createSpeakingPromptItem({
      speaking_prompt_id: promptId,
      item_text: normalizeText(body.itemText),
      sort_order: body.sortOrder,
    });

    return mapSpeakingPromptItem(created);
  },

  async updateSpeakingPromptItem(
    itemId: string,
    body: UpdateSpeakingPromptItemBody,
  ) {
    const existing =
      await speakingRepository.findSpeakingPromptItemById(itemId);

    if (!existing) {
      throw new NotFoundError(MESSAGE.SPEAKING.ITEM_NOT_FOUND);
    }

    if (body.sortOrder !== undefined) {
      const sortOrderConflict =
        await speakingRepository.findSpeakingPromptItemBySortOrder(
          existing.speaking_prompt_id,
          body.sortOrder,
          itemId,
        );

      if (sortOrderConflict) {
        throw new ConflictError(MESSAGE.SPEAKING.ITEM_SORT_ORDER_EXISTS);
      }
    }

    const updated = await speakingRepository.updateSpeakingPromptItem(itemId, {
      ...(body.itemText !== undefined
        ? { item_text: normalizeText(body.itemText) }
        : {}),
      ...(body.sortOrder !== undefined ? { sort_order: body.sortOrder } : {}),
    });

    return mapSpeakingPromptItem(updated);
  },

  async deleteSpeakingPromptItem(itemId: string) {
    const existing =
      await speakingRepository.findSpeakingPromptItemById(itemId);

    if (!existing) {
      throw new NotFoundError(MESSAGE.SPEAKING.ITEM_NOT_FOUND);
    }

    await speakingRepository.deleteSpeakingPromptItem(itemId);

    return {
      success: true,
    };
  },
};
