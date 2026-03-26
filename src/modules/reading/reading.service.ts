import { Prisma, publish_status, question_type } from "@prisma/client";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { ConflictError } from "../../common/errors/conflict.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../common/utils/pagination";
import {
  mapAdminReadingQuestion,
  mapAdminReadingSetDetail,
  mapPublicReadingSetDetail,
  mapReadingSetList,
} from "./reading.mapper";
import { readingRepository } from "./reading.repository";
import {
  CreateReadingQuestionBody,
  CreateReadingSetBody,
  ReadingSetListQuery,
  UpdateReadingQuestionBody,
  UpdateReadingSetBody,
} from "./reading.types";

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

  const count = await readingRepository.countTagsByIds(uniqueIds);

  if (count !== uniqueIds.length) {
    throw new BadRequestError(MESSAGE.READING.TAG_NOT_FOUND);
  }

  return uniqueIds;
}

export const readingService = {
  async getPublicReadingSets(query: ReadingSetListQuery) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      readingRepository.findPublicReadingSets({
        skip: pagination.skip,
        take: pagination.limit,
        search: query.search?.trim() || undefined,
        level: query.level,
        tagIds: query.tagIds,
      }),
      readingRepository.countPublicReadingSets({
        search: query.search?.trim() || undefined,
        level: query.level,
        tagIds: query.tagIds,
      }),
    ]);

    return {
      items: items.map(mapReadingSetList),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getPublicReadingSetDetail(id: string) {
    const readingSet = await readingRepository.findPublicReadingSetDetail(id);

    if (!readingSet) {
      throw new NotFoundError(MESSAGE.READING.SET_NOT_FOUND);
    }

    return mapPublicReadingSetDetail(readingSet);
  },

  async getAdminReadingSets(query: ReadingSetListQuery) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      readingRepository.findAdminReadingSets({
        skip: pagination.skip,
        take: pagination.limit,
        search: query.search?.trim() || undefined,
        level: query.level,
        tagIds: query.tagIds,
        status: query.status as publish_status | undefined,
      }),
      readingRepository.countAdminReadingSets({
        search: query.search?.trim() || undefined,
        level: query.level,
        tagIds: query.tagIds,
        status: query.status as publish_status | undefined,
      }),
    ]);

    return {
      items: items.map(mapReadingSetList),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getAdminReadingSetDetail(id: string) {
    const readingSet = await readingRepository.findAdminReadingSetDetail(id);

    if (!readingSet) {
      throw new NotFoundError(MESSAGE.READING.SET_NOT_FOUND);
    }

    return mapAdminReadingSetDetail(readingSet);
  },

  async createReadingSet(adminUserId: string, body: CreateReadingSetBody) {
    const existing = await readingRepository.findReadingSetById(body.id);

    if (existing) {
      throw new ConflictError(MESSAGE.READING.SET_ID_EXISTS);
    }

    const tagIds = await assertTagsExist(body.tagIds);

    const created = await readingRepository.createReadingSet({
      id: body.id,
      title: normalizeText(body.title),
      passage_html: normalizeNullableText(body.passageHtml),
      passage_text: normalizeNullableText(body.passageText),
      level: body.level,
      status:
        (body.status as publish_status | undefined) ?? publish_status.DRAFT,
      created_by: adminUserId,
      tagIds,
    });

    return mapAdminReadingSetDetail(created!);
  },

  async updateReadingSet(id: string, body: UpdateReadingSetBody) {
    const existing = await readingRepository.findReadingSetById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.READING.SET_NOT_FOUND);
    }

    const tagIds =
      body.tagIds !== undefined
        ? await assertTagsExist(body.tagIds)
        : undefined;

    const updated = await readingRepository.updateReadingSet(id, {
      ...(body.title !== undefined ? { title: normalizeText(body.title) } : {}),
      ...(body.passageHtml !== undefined
        ? { passage_html: normalizeNullableText(body.passageHtml) }
        : {}),
      ...(body.passageText !== undefined
        ? { passage_text: normalizeNullableText(body.passageText) }
        : {}),
      ...(body.level !== undefined ? { level: body.level } : {}),
      ...(body.status !== undefined
        ? { status: body.status as publish_status }
        : {}),
      ...(tagIds !== undefined ? { tagIds } : {}),
    });

    return mapAdminReadingSetDetail(updated!);
  },

  async deleteReadingSet(id: string) {
    const existing = await readingRepository.findReadingSetById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.READING.SET_NOT_FOUND);
    }

    const [testSectionCount, attemptUsage] = await Promise.all([
      readingRepository.countTestSectionsUsingReadingSet(id),
      readingRepository.countAttemptUsageByReadingSet(id),
    ]);

    if (testSectionCount > 0) {
      throw new ConflictError(
        MESSAGE.READING.SET_IN_USE,
        "READING_SET_IN_USE",
        { testSectionCount },
      );
    }

    if (attemptUsage.total > 0) {
      throw new ConflictError(
        MESSAGE.READING.SET_HAS_ATTEMPT_DATA,
        "READING_SET_HAS_ATTEMPT_DATA",
        attemptUsage,
      );
    }

    await readingRepository.deleteReadingSet(id);

    return {
      success: true,
    };
  },

  async publishReadingSet(id: string) {
    const readingSet =
      await readingRepository.findReadingSetStructureForPublish(id);

    if (!readingSet) {
      throw new NotFoundError(MESSAGE.READING.SET_NOT_FOUND);
    }

    if (!readingSet.title.trim()) {
      throw new BadRequestError(MESSAGE.READING.PUBLISH_TITLE_REQUIRED);
    }

    if (readingSet.level === null) {
      throw new BadRequestError(MESSAGE.READING.PUBLISH_LEVEL_REQUIRED);
    }

    const hasPassage =
      !!readingSet.passage_html?.trim() || !!readingSet.passage_text?.trim();

    if (!hasPassage) {
      throw new BadRequestError(MESSAGE.READING.PUBLISH_PASSAGE_REQUIRED);
    }

    if (readingSet.questions.length === 0) {
      throw new BadRequestError(MESSAGE.READING.PUBLISH_QUESTION_REQUIRED);
    }

    for (const question of readingSet.questions) {
      if (isEmptyJson(question.correct_answer_json)) {
        throw new BadRequestError(
          MESSAGE.READING.PUBLISH_CORRECT_ANSWER_REQUIRED,
          "READING_CORRECT_ANSWER_REQUIRED",
          {
            questionId: question.id,
            qNo: question.q_no,
          },
        );
      }
    }

    const published = await readingRepository.publishReadingSet(id);

    return mapAdminReadingSetDetail(published);
  },

  async unpublishReadingSet(id: string) {
    const existing = await readingRepository.findReadingSetById(id);

    if (!existing) {
      throw new NotFoundError(MESSAGE.READING.SET_NOT_FOUND);
    }

    const unpublished = await readingRepository.unpublishReadingSet(id);

    return mapAdminReadingSetDetail(unpublished);
  },

  async createReadingQuestion(
    readingSetId: string,
    body: CreateReadingQuestionBody,
  ) {
    const readingSet = await readingRepository.findReadingSetById(readingSetId);

    if (!readingSet) {
      throw new NotFoundError(MESSAGE.READING.SET_NOT_FOUND);
    }

    const [qNoConflict, sortOrderConflict] = await Promise.all([
      readingRepository.findReadingQuestionByQNo(readingSetId, body.qNo),
      readingRepository.findReadingQuestionBySortOrder(
        readingSetId,
        body.sortOrder,
      ),
    ]);

    if (qNoConflict) {
      throw new ConflictError(MESSAGE.READING.QUESTION_QNO_EXISTS);
    }

    if (sortOrderConflict) {
      throw new ConflictError(MESSAGE.READING.QUESTION_SORT_ORDER_EXISTS);
    }

    const created = await readingRepository.createReadingQuestion({
      reading_set_id: readingSetId,
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

    return mapAdminReadingQuestion(created);
  },

  async updateReadingQuestion(
    questionId: string,
    body: UpdateReadingQuestionBody,
  ) {
    const existing =
      await readingRepository.findReadingQuestionById(questionId);

    if (!existing || !existing.reading_set_id) {
      throw new NotFoundError(MESSAGE.READING.QUESTION_NOT_FOUND);
    }

    if (body.qNo !== undefined) {
      const qNoConflict = await readingRepository.findReadingQuestionByQNo(
        existing.reading_set_id,
        body.qNo,
        questionId,
      );

      if (qNoConflict) {
        throw new ConflictError(MESSAGE.READING.QUESTION_QNO_EXISTS);
      }
    }

    if (body.sortOrder !== undefined) {
      const sortOrderConflict =
        await readingRepository.findReadingQuestionBySortOrder(
          existing.reading_set_id,
          body.sortOrder,
          questionId,
        );

      if (sortOrderConflict) {
        throw new ConflictError(MESSAGE.READING.QUESTION_SORT_ORDER_EXISTS);
      }
    }

    const updated = await readingRepository.updateReadingQuestion(questionId, {
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
    });

    return mapAdminReadingQuestion(updated);
  },

  async deleteReadingQuestion(questionId: string) {
    const existing =
      await readingRepository.findReadingQuestionById(questionId);

    if (!existing) {
      throw new NotFoundError(MESSAGE.READING.QUESTION_NOT_FOUND);
    }

    const usage =
      await readingRepository.countAttemptUsageByQuestion(questionId);

    if (usage.total > 0) {
      throw new ConflictError(
        MESSAGE.READING.QUESTION_IN_USE,
        "READING_QUESTION_IN_USE",
        usage,
      );
    }

    await readingRepository.deleteReadingQuestion(questionId);

    return {
      success: true,
    };
  },
};
