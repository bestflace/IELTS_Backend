import { publish_status } from "@prisma/client";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { ConflictError } from "../../common/errors/conflict.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../common/utils/pagination";
import {
  mapAdminWritingTaskDetail,
  mapPublicWritingTaskDetail,
  mapWritingTaskList,
} from "./writing.mapper";
import { writingRepository } from "./writing.repository";
import {
  CreateWritingTaskBody,
  UpdateWritingTaskBody,
  WritingTaskListQuery,
} from "./writing.types";

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

  const count = await writingRepository.countTagsByIds(uniqueIds);

  if (count !== uniqueIds.length) {
    throw new BadRequestError(MESSAGE.WRITING.TAG_NOT_FOUND);
  }

  return uniqueIds;
}

export const writingService = {
  async getPublicWritingTasks(query: WritingTaskListQuery) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      writingRepository.findPublicWritingTasks({
        skip: pagination.skip,
        take: pagination.limit,
        search: query.search?.trim() || undefined,
        level: query.level,
        taskNo: query.taskNo,
        tagIds: query.tagIds,
      }),
      writingRepository.countPublicWritingTasks({
        search: query.search?.trim() || undefined,
        level: query.level,
        taskNo: query.taskNo,
        tagIds: query.tagIds,
      }),
    ]);

    return {
      items: items.map(mapWritingTaskList),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getPublicWritingTaskDetail(id: string) {
    const task = await writingRepository.findPublicWritingTaskDetail(id);

    if (!task) {
      throw new NotFoundError(MESSAGE.WRITING.TASK_NOT_FOUND);
    }

    return mapPublicWritingTaskDetail(task);
  },

  async getAdminWritingTasks(query: WritingTaskListQuery) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      writingRepository.findAdminWritingTasks({
        skip: pagination.skip,
        take: pagination.limit,
        search: query.search?.trim() || undefined,
        level: query.level,
        taskNo: query.taskNo,
        tagIds: query.tagIds,
        status: query.status as publish_status | undefined,
      }),
      writingRepository.countAdminWritingTasks({
        search: query.search?.trim() || undefined,
        level: query.level,
        taskNo: query.taskNo,
        tagIds: query.tagIds,
        status: query.status as publish_status | undefined,
      }),
    ]);

    return {
      items: items.map(mapWritingTaskList),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getAdminWritingTaskDetail(id: string) {
    const task = await writingRepository.findAdminWritingTaskDetail(id);

    if (!task) {
      throw new NotFoundError(MESSAGE.WRITING.TASK_NOT_FOUND);
    }

    return mapAdminWritingTaskDetail(task);
  },

  async createWritingTask(adminUserId: string, body: CreateWritingTaskBody) {
    const existing = await writingRepository.findWritingTaskById(body.id);

    if (existing) {
      throw new ConflictError(MESSAGE.WRITING.TASK_ID_EXISTS);
    }

    const tagIds = await assertTagsExist(body.tagIds);

    const created = await writingRepository.createWritingTask({
      id: body.id,
      task_no: body.taskNo ?? null,
      title: normalizeText(body.title),
      prompt_text: normalizeText(body.promptText),
      chart_url: body.chartUrl?.trim() || null,
      image_url: body.imageUrl?.trim() || null,
      level: body.level ?? null,
      status:
        (body.status as publish_status | undefined) ?? publish_status.DRAFT,
      created_by: adminUserId,
      tagIds,
    });

    return mapAdminWritingTaskDetail(created!);
  },

  async updateWritingTask(id: string, body: UpdateWritingTaskBody) {
    const existing = await writingRepository.findWritingTaskById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.WRITING.TASK_NOT_FOUND);
    }

    const tagIds =
      body.tagIds !== undefined
        ? await assertTagsExist(body.tagIds)
        : undefined;

    const updated = await writingRepository.updateWritingTask(id, {
      ...(body.taskNo !== undefined ? { task_no: body.taskNo } : {}),
      ...(body.title !== undefined ? { title: normalizeText(body.title) } : {}),
      ...(body.promptText !== undefined
        ? { prompt_text: normalizeText(body.promptText) }
        : {}),
      ...(body.chartUrl !== undefined
        ? { chart_url: body.chartUrl?.trim() || null }
        : {}),
      ...(body.imageUrl !== undefined
        ? { image_url: body.imageUrl?.trim() || null }
        : {}),
      ...(body.level !== undefined ? { level: body.level } : {}),
      ...(body.status !== undefined
        ? { status: body.status as publish_status }
        : {}),
      ...(tagIds !== undefined ? { tagIds } : {}),
    });

    return mapAdminWritingTaskDetail(updated!);
  },

  async deleteWritingTask(id: string) {
    const existing = await writingRepository.findWritingTaskById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.WRITING.TASK_NOT_FOUND);
    }

    const [testSectionCount, attemptCount] = await Promise.all([
      writingRepository.countTestSectionsUsingWritingTask(id),
      writingRepository.countAttemptUsageByWritingTask(id),
    ]);

    if (testSectionCount > 0) {
      throw new ConflictError(
        MESSAGE.WRITING.TASK_IN_USE,
        "WRITING_TASK_IN_USE",
        { testSectionCount },
      );
    }

    if (attemptCount > 0) {
      throw new ConflictError(
        MESSAGE.WRITING.TASK_HAS_ATTEMPT_DATA,
        "WRITING_TASK_HAS_ATTEMPT_DATA",
        { attemptCount },
      );
    }

    await writingRepository.deleteWritingTask(id);

    return {
      success: true,
    };
  },

  async publishWritingTask(id: string) {
    const task = await writingRepository.findWritingTaskStructureForPublish(id);

    if (!task) {
      throw new NotFoundError(MESSAGE.WRITING.TASK_NOT_FOUND);
    }

    if (task.task_no === null) {
      throw new BadRequestError(MESSAGE.WRITING.PUBLISH_TASK_NO_REQUIRED);
    }

    if (!task.title.trim()) {
      throw new BadRequestError(MESSAGE.WRITING.PUBLISH_TITLE_REQUIRED);
    }

    if (!task.prompt_text.trim()) {
      throw new BadRequestError(MESSAGE.WRITING.PUBLISH_PROMPT_REQUIRED);
    }

    if (task.level === null) {
      throw new BadRequestError(MESSAGE.WRITING.PUBLISH_LEVEL_REQUIRED);
    }

    const published = await writingRepository.publishWritingTask(id);

    return mapAdminWritingTaskDetail(published);
  },

  async unpublishWritingTask(id: string) {
    const existing = await writingRepository.findWritingTaskById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.WRITING.TASK_NOT_FOUND);
    }

    const unpublished = await writingRepository.unpublishWritingTask(id);

    return mapAdminWritingTaskDetail(unpublished);
  },
};
