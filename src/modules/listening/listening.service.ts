import {
  Prisma,
  audio_source_type,
  publish_status,
  question_type,
} from "@prisma/client";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { ConflictError } from "../../common/errors/conflict.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../common/utils/pagination";
import {
  mapAdminListeningQuestion,
  mapAdminListeningSetDetail,
  mapListeningSetList,
  mapPublicListeningSetDetail,
} from "./listening.mapper";
import { listeningRepository } from "./listening.repository";
import {
  CreateListeningQuestionBody,
  CreateListeningSetBody,
  ListeningSetListQuery,
  UpdateListeningQuestionBody,
  UpdateListeningSetBody,
} from "./listening.types";

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

function isEmptyJson(value: unknown): boolean {
  if (value === null || value === undefined) return true;

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length === 0;
  }

  return false;
}
function toNullableJsonInput(
  value: Prisma.InputJsonValue | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  return value;
}
async function assertTagsExist(tagIds?: string[]) {
  const uniqueIds = uniqueTagIds(tagIds);

  if (uniqueIds.length === 0) return uniqueIds;

  const count = await listeningRepository.countTagsByIds(uniqueIds);

  if (count !== uniqueIds.length) {
    throw new BadRequestError(MESSAGE.LISTENING.TAG_NOT_FOUND);
  }

  return uniqueIds;
}

export const listeningService = {
  async getPublicListeningSets(query: ListeningSetListQuery) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      listeningRepository.findPublicListeningSets({
        skip: pagination.skip,
        take: pagination.limit,
        search: query.search?.trim() || undefined,
        level: query.level,
        tagIds: query.tagIds,
      }),
      listeningRepository.countPublicListeningSets({
        search: query.search?.trim() || undefined,
        level: query.level,
        tagIds: query.tagIds,
      }),
    ]);

    return {
      items: items.map(mapListeningSetList),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getPublicListeningSetDetail(id: string) {
    const listeningSet =
      await listeningRepository.findPublicListeningSetDetail(id);

    if (!listeningSet) {
      throw new NotFoundError(MESSAGE.LISTENING.SET_NOT_FOUND);
    }

    return mapPublicListeningSetDetail(listeningSet);
  },

  async getAdminListeningSets(query: ListeningSetListQuery) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      listeningRepository.findAdminListeningSets({
        skip: pagination.skip,
        take: pagination.limit,
        search: query.search?.trim() || undefined,
        level: query.level,
        tagIds: query.tagIds,
        status: query.status as publish_status | undefined,
      }),
      listeningRepository.countAdminListeningSets({
        search: query.search?.trim() || undefined,
        level: query.level,
        tagIds: query.tagIds,
        status: query.status as publish_status | undefined,
      }),
    ]);

    return {
      items: items.map(mapListeningSetList),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getAdminListeningSetDetail(id: string) {
    const listeningSet =
      await listeningRepository.findAdminListeningSetDetail(id);

    if (!listeningSet) {
      throw new NotFoundError(MESSAGE.LISTENING.SET_NOT_FOUND);
    }

    return mapAdminListeningSetDetail(listeningSet);
  },

  async createListeningSet(adminUserId: string, body: CreateListeningSetBody) {
    const existing = await listeningRepository.findListeningSetById(body.id);

    if (existing) {
      throw new ConflictError(MESSAGE.LISTENING.SET_ID_EXISTS);
    }

    const tagIds = await assertTagsExist(body.tagIds);

    const created = await listeningRepository.createListeningSet({
      id: body.id,
      title: normalizeText(body.title),
      transcript_text: normalizeNullableText(body.transcriptText),
      audio_url: body.audioUrl?.trim() || null,
      audio_source:
        (body.audioSource as audio_source_type | null | undefined) ?? null,
      level: body.level,
      status:
        (body.status as publish_status | undefined) ?? publish_status.DRAFT,
      created_by: adminUserId,
      tagIds,
    });

    return mapAdminListeningSetDetail(created!);
  },

  async updateListeningSet(id: string, body: UpdateListeningSetBody) {
    const existing = await listeningRepository.findListeningSetById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.LISTENING.SET_NOT_FOUND);
    }

    const tagIds =
      body.tagIds !== undefined
        ? await assertTagsExist(body.tagIds)
        : undefined;

    const updated = await listeningRepository.updateListeningSet(id, {
      ...(body.title !== undefined ? { title: normalizeText(body.title) } : {}),
      ...(body.transcriptText !== undefined
        ? { transcript_text: normalizeNullableText(body.transcriptText) }
        : {}),
      ...(body.audioUrl !== undefined
        ? { audio_url: body.audioUrl?.trim() || null }
        : {}),
      ...(body.audioSource !== undefined
        ? { audio_source: body.audioSource as audio_source_type | null }
        : {}),
      ...(body.level !== undefined ? { level: body.level } : {}),
      ...(body.status !== undefined
        ? { status: body.status as publish_status }
        : {}),
      ...(tagIds !== undefined ? { tagIds } : {}),
    });

    return mapAdminListeningSetDetail(updated!);
  },

  async deleteListeningSet(id: string) {
    const existing = await listeningRepository.findListeningSetById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.LISTENING.SET_NOT_FOUND);
    }

    const [testSectionCount, attemptUsage] = await Promise.all([
      listeningRepository.countTestSectionsUsingListeningSet(id),
      listeningRepository.countAttemptUsageByListeningSet(id),
    ]);

    if (testSectionCount > 0) {
      throw new ConflictError(
        MESSAGE.LISTENING.SET_IN_USE,
        "LISTENING_SET_IN_USE",
        { testSectionCount },
      );
    }

    if (attemptUsage.total > 0) {
      throw new ConflictError(
        MESSAGE.LISTENING.SET_HAS_ATTEMPT_DATA,
        "LISTENING_SET_HAS_ATTEMPT_DATA",
        attemptUsage,
      );
    }

    await listeningRepository.deleteListeningSet(id);

    return {
      success: true,
    };
  },

  async publishListeningSet(id: string) {
    const listeningSet =
      await listeningRepository.findListeningSetStructureForPublish(id);

    if (!listeningSet) {
      throw new NotFoundError(MESSAGE.LISTENING.SET_NOT_FOUND);
    }

    if (!listeningSet.title.trim()) {
      throw new BadRequestError(MESSAGE.LISTENING.PUBLISH_TITLE_REQUIRED);
    }

    if (listeningSet.level === null) {
      throw new BadRequestError(MESSAGE.LISTENING.PUBLISH_LEVEL_REQUIRED);
    }

    if (!listeningSet.audio_url?.trim()) {
      throw new BadRequestError(MESSAGE.LISTENING.PUBLISH_AUDIO_REQUIRED);
    }

    if (!listeningSet.audio_source) {
      throw new BadRequestError(
        MESSAGE.LISTENING.PUBLISH_AUDIO_SOURCE_REQUIRED,
      );
    }

    if (listeningSet.questions.length === 0) {
      throw new BadRequestError(MESSAGE.LISTENING.PUBLISH_QUESTION_REQUIRED);
    }

    for (const question of listeningSet.questions) {
      if (isEmptyJson(question.correct_answer_json)) {
        throw new BadRequestError(
          MESSAGE.LISTENING.PUBLISH_CORRECT_ANSWER_REQUIRED,
          "LISTENING_CORRECT_ANSWER_REQUIRED",
          {
            questionId: question.id,
            qNo: question.q_no,
          },
        );
      }
    }

    const published = await listeningRepository.publishListeningSet(id);

    return mapAdminListeningSetDetail(published);
  },

  async unpublishListeningSet(id: string) {
    const existing = await listeningRepository.findListeningSetById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.LISTENING.SET_NOT_FOUND);
    }

    const unpublished = await listeningRepository.unpublishListeningSet(id);

    return mapAdminListeningSetDetail(unpublished);
  },

  async createListeningQuestion(
    listeningSetId: string,
    body: CreateListeningQuestionBody,
  ) {
    const listeningSet =
      await listeningRepository.findListeningSetById(listeningSetId);

    if (!listeningSet) {
      throw new NotFoundError(MESSAGE.LISTENING.SET_NOT_FOUND);
    }

    const [qNoConflict, sortOrderConflict] = await Promise.all([
      listeningRepository.findListeningQuestionByQNo(listeningSetId, body.qNo),
      listeningRepository.findListeningQuestionBySortOrder(
        listeningSetId,
        body.sortOrder,
      ),
    ]);

    if (qNoConflict) {
      throw new ConflictError(MESSAGE.LISTENING.QUESTION_QNO_EXISTS);
    }

    if (sortOrderConflict) {
      throw new ConflictError(MESSAGE.LISTENING.QUESTION_SORT_ORDER_EXISTS);
    }

    const created = await listeningRepository.createListeningQuestion({
      listening_set_id: listeningSetId,
      section_label: normalizeNullableText(body.sectionLabel),
      q_no: body.qNo,
      question_type: body.questionType as question_type,
      prompt_text: normalizeText(body.promptText),
      instruction_text: normalizeNullableText(body.instructionText),
      options_json: toNullableJsonInput(
        body.optionsJson as Prisma.InputJsonValue | null | undefined,
      ),
      correct_answer_json: body.correctAnswerJson as Prisma.InputJsonValue,
      explanation: normalizeNullableText(body.explanation),
      points: body.points ?? 1,
      sort_order: body.sortOrder,
    });

    return mapAdminListeningQuestion(created);
  },

  async updateListeningQuestion(
    questionId: string,
    body: UpdateListeningQuestionBody,
  ) {
    const existing =
      await listeningRepository.findListeningQuestionById(questionId);

    if (!existing || !existing.listening_set_id) {
      throw new NotFoundError(MESSAGE.LISTENING.QUESTION_NOT_FOUND);
    }

    if (body.qNo !== undefined) {
      const qNoConflict = await listeningRepository.findListeningQuestionByQNo(
        existing.listening_set_id,
        body.qNo,
        questionId,
      );

      if (qNoConflict) {
        throw new ConflictError(MESSAGE.LISTENING.QUESTION_QNO_EXISTS);
      }
    }

    if (body.sortOrder !== undefined) {
      const sortOrderConflict =
        await listeningRepository.findListeningQuestionBySortOrder(
          existing.listening_set_id,
          body.sortOrder,
          questionId,
        );

      if (sortOrderConflict) {
        throw new ConflictError(MESSAGE.LISTENING.QUESTION_SORT_ORDER_EXISTS);
      }
    }

    const updated = await listeningRepository.updateListeningQuestion(
      questionId,
      {
        ...(body.sectionLabel !== undefined
          ? { section_label: normalizeNullableText(body.sectionLabel) }
          : {}),
        ...(body.qNo !== undefined ? { q_no: body.qNo } : {}),
        ...(body.questionType !== undefined
          ? { question_type: body.questionType as question_type }
          : {}),
        ...(body.promptText !== undefined
          ? { prompt_text: normalizeText(body.promptText) }
          : {}),
        ...(body.instructionText !== undefined
          ? { instruction_text: normalizeNullableText(body.instructionText) }
          : {}),
        ...(body.optionsJson !== undefined
          ? {
              options_json: toNullableJsonInput(
                body.optionsJson as Prisma.InputJsonValue | null,
              ),
            }
          : {}),
        ...(body.correctAnswerJson !== undefined
          ? {
              correct_answer_json:
                body.correctAnswerJson as Prisma.InputJsonValue,
            }
          : {}),
        ...(body.explanation !== undefined
          ? { explanation: normalizeNullableText(body.explanation) }
          : {}),
        ...(body.points !== undefined ? { points: body.points } : {}),
        ...(body.sortOrder !== undefined ? { sort_order: body.sortOrder } : {}),
      },
    );

    return mapAdminListeningQuestion(updated);
  },

  async deleteListeningQuestion(questionId: string) {
    const existing =
      await listeningRepository.findListeningQuestionById(questionId);

    if (!existing) {
      throw new NotFoundError(MESSAGE.LISTENING.QUESTION_NOT_FOUND);
    }

    const usage =
      await listeningRepository.countAttemptUsageByQuestion(questionId);

    if (usage.total > 0) {
      throw new ConflictError(
        MESSAGE.LISTENING.QUESTION_IN_USE,
        "LISTENING_QUESTION_IN_USE",
        usage,
      );
    }

    await listeningRepository.deleteListeningQuestion(questionId);

    return {
      success: true,
    };
  },
};
