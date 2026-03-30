import { publish_status, test_section_type, test_type } from "@prisma/client";
import { DEFAULT_SYSTEM_CONFIG } from "../../common/constants/system-config.constant";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { ConflictError } from "../../common/errors/conflict.error";
import { ForbiddenError } from "../../common/errors/forbidden.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../common/utils/pagination";
import { enqueueTestPublishedNotification } from "../../jobs/queues";
import {
  mapAdminTestDetail,
  mapPublicTestDetail,
  mapSectionDetail,
  mapTestList,
} from "./test.mapper";
import { testRepository } from "./test.repository";
import {
  CreateTestBody,
  RandomBuildBody,
  ReplaceSectionsBody,
  TestListQuery,
  TestSectionInput,
  UpdateTestBody,
  UpdateTestSectionBody,
} from "./test.types";

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

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function generateTestId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `TEST_${ts}${rand}`.slice(0, 32);
}

function getAllowedSectionTypeByTestType(
  type: test_type,
): test_section_type | null {
  if (type === test_type.READING) return test_section_type.READING_SET;
  if (type === test_type.LISTENING) return test_section_type.LISTENING_SET;
  if (type === test_type.WRITING) return test_section_type.WRITING_TASK;
  if (type === test_type.SPEAKING) return test_section_type.SPEAKING_SET;
  return null;
}

async function assertTagsExist(tagIds?: string[]) {
  const uniqueIds = uniqueTagIds(tagIds);

  if (uniqueIds.length === 0) return uniqueIds;

  const count = await testRepository.countTagsByIds(uniqueIds);

  if (count !== uniqueIds.length) {
    throw new BadRequestError(MESSAGE.TEST.TAG_NOT_FOUND);
  }

  return uniqueIds;
}

function validateSectionShape(section: {
  sectionType:
    | "READING_SET"
    | "LISTENING_SET"
    | "WRITING_TASK"
    | "SPEAKING_SET";
  readingSetId?: string | null;
  listeningSetId?: string | null;
  writingTaskId?: string | null;
  speakingSetId?: string | null;
}) {
  const ids = {
    READING_SET: section.readingSetId ?? null,
    LISTENING_SET: section.listeningSetId ?? null,
    WRITING_TASK: section.writingTaskId ?? null,
    SPEAKING_SET: section.speakingSetId ?? null,
  };

  const expectedId = ids[section.sectionType];
  const usedCount = Object.values(ids).filter(Boolean).length;

  if (!expectedId || usedCount !== 1) {
    throw new BadRequestError(MESSAGE.TEST.INVALID_SECTION_SOURCE);
  }
}

async function validateSectionSourceExists(section: {
  sectionType:
    | "READING_SET"
    | "LISTENING_SET"
    | "WRITING_TASK"
    | "SPEAKING_SET";
  readingSetId?: string | null;
  listeningSetId?: string | null;
  writingTaskId?: string | null;
  speakingSetId?: string | null;
}) {
  validateSectionShape(section);

  if (section.sectionType === "READING_SET") {
    const source = await testRepository.findReadingSource(
      String(section.readingSetId),
    );
    if (!source) throw new BadRequestError(MESSAGE.TEST.INVALID_SECTION_SOURCE);
    return;
  }

  if (section.sectionType === "LISTENING_SET") {
    const source = await testRepository.findListeningSource(
      String(section.listeningSetId),
    );
    if (!source) throw new BadRequestError(MESSAGE.TEST.INVALID_SECTION_SOURCE);
    return;
  }

  if (section.sectionType === "WRITING_TASK") {
    const source = await testRepository.findWritingSource(
      String(section.writingTaskId),
    );
    if (!source) throw new BadRequestError(MESSAGE.TEST.INVALID_SECTION_SOURCE);
    return;
  }

  const source = await testRepository.findSpeakingSource(
    String(section.speakingSetId),
  );
  if (!source) throw new BadRequestError(MESSAGE.TEST.INVALID_SECTION_SOURCE);
}

function assertSectionCompatibility(
  testType: test_type,
  sectionType: test_section_type,
) {
  const allowed = getAllowedSectionTypeByTestType(testType);

  if (allowed && allowed !== sectionType) {
    throw new BadRequestError(MESSAGE.TEST.INVALID_SECTION_FOR_TEST_TYPE);
  }
}

async function validateSectionsForDraft(
  testType: test_type,
  sections: TestSectionInput[],
) {
  const qnos = new Set<number>();

  for (const section of sections) {
    assertSectionCompatibility(
      testType,
      section.sectionType as test_section_type,
    );

    if (qnos.has(section.sortOrder)) {
      throw new ConflictError(MESSAGE.TEST.SECTION_SORT_ORDER_EXISTS);
    }

    qnos.add(section.sortOrder);

    await validateSectionSourceExists({
      sectionType: section.sectionType,
      readingSetId: section.readingSetId,
      listeningSetId: section.listeningSetId,
      writingTaskId: section.writingTaskId,
      speakingSetId: section.speakingSetId,
    });
  }
}

async function assertTestMutable(testId: string) {
  const test = await testRepository.findTestById(testId);

  if (!test) {
    throw new NotFoundError(MESSAGE.TEST.NOT_FOUND);
  }

  if (test.status === publish_status.PUBLISHED) {
    throw new ForbiddenError(MESSAGE.TEST.CANNOT_MUTATE_PUBLISHED);
  }

  return test;
}

async function getSystemDefaultTimes() {
  const rows = await testRepository.findSystemConfigRows([
    "readingDefaultSec",
    "listeningDefaultSec",
    "writingDefaultSec",
    "speakingDefaultSec",
  ]);

  const merged = {
    readingDefaultSec: DEFAULT_SYSTEM_CONFIG.readingDefaultSec,
    listeningDefaultSec: DEFAULT_SYSTEM_CONFIG.listeningDefaultSec,
    writingDefaultSec: DEFAULT_SYSTEM_CONFIG.writingDefaultSec,
    speakingDefaultSec: DEFAULT_SYSTEM_CONFIG.speakingDefaultSec,
  };

  for (const row of rows) {
    if (row.key in merged) {
      (merged as Record<string, unknown>)[row.key] = row.value_json;
    }
  }

  return merged;
}

function getDefaultTimeLimitBySectionType(
  sectionType: test_section_type,
  timing: Awaited<ReturnType<typeof getSystemDefaultTimes>>,
) {
  if (sectionType === test_section_type.READING_SET)
    return Number(timing.readingDefaultSec);
  if (sectionType === test_section_type.LISTENING_SET)
    return Number(timing.listeningDefaultSec);
  if (sectionType === test_section_type.WRITING_TASK)
    return Number(timing.writingDefaultSec);
  return Number(timing.speakingDefaultSec);
}

async function validateSectionsForPublish(testId: string) {
  const detail = await testRepository.findAdminTestDetail(testId);

  if (!detail) {
    throw new NotFoundError(MESSAGE.TEST.NOT_FOUND);
  }

  if (!detail.title.trim()) {
    throw new BadRequestError(MESSAGE.TEST.PUBLISH_TITLE_REQUIRED);
  }

  if (detail.level === null) {
    throw new BadRequestError(MESSAGE.TEST.PUBLISH_LEVEL_REQUIRED);
  }

  if (detail.test_sections.length === 0) {
    throw new BadRequestError(MESSAGE.TEST.PUBLISH_SECTION_REQUIRED);
  }

  const sortOrders = new Set<number>();
  const sectionTypes = new Set<test_section_type>();

  for (const section of detail.test_sections) {
    const sectionType = section.section_type as test_section_type;
    sectionTypes.add(sectionType);

    if (sortOrders.has(section.sort_order)) {
      throw new BadRequestError(MESSAGE.TEST.SECTION_SORT_ORDER_EXISTS);
    }

    sortOrders.add(section.sort_order);

    if (sectionType === test_section_type.READING_SET) {
      if (!section.reading_sets) {
        throw new BadRequestError(MESSAGE.TEST.INVALID_SECTION_SOURCE);
      }
      if (section.reading_sets.status !== publish_status.PUBLISHED) {
        throw new BadRequestError(
          MESSAGE.TEST.PUBLISH_SECTION_SOURCE_MUST_BE_PUBLISHED,
        );
      }
    }

    if (sectionType === test_section_type.LISTENING_SET) {
      if (!section.listening_sets) {
        throw new BadRequestError(MESSAGE.TEST.INVALID_SECTION_SOURCE);
      }
      if (section.listening_sets.status !== publish_status.PUBLISHED) {
        throw new BadRequestError(
          MESSAGE.TEST.PUBLISH_SECTION_SOURCE_MUST_BE_PUBLISHED,
        );
      }
    }

    if (sectionType === test_section_type.WRITING_TASK) {
      if (!section.writing_tasks) {
        throw new BadRequestError(MESSAGE.TEST.INVALID_SECTION_SOURCE);
      }
      if (section.writing_tasks.status !== publish_status.PUBLISHED) {
        throw new BadRequestError(
          MESSAGE.TEST.PUBLISH_SECTION_SOURCE_MUST_BE_PUBLISHED,
        );
      }
    }

    if (sectionType === test_section_type.SPEAKING_SET) {
      if (!section.speaking_sets) {
        throw new BadRequestError(MESSAGE.TEST.INVALID_SECTION_SOURCE);
      }
      if (section.speaking_sets.status !== publish_status.PUBLISHED) {
        throw new BadRequestError(
          MESSAGE.TEST.PUBLISH_SECTION_SOURCE_MUST_BE_PUBLISHED,
        );
      }
    }
  }

  const testType = detail.type as test_type;
  const allowedSection = getAllowedSectionTypeByTestType(testType);

  if (allowedSection) {
    for (const sectionType of sectionTypes) {
      if (sectionType !== allowedSection) {
        throw new BadRequestError(MESSAGE.TEST.INVALID_SECTION_FOR_TEST_TYPE);
      }
    }
  } else {
    const required = [
      test_section_type.READING_SET,
      test_section_type.LISTENING_SET,
      test_section_type.WRITING_TASK,
      test_section_type.SPEAKING_SET,
    ];

    const missing = required.filter((type) => !sectionTypes.has(type));
    if (missing.length > 0) {
      throw new BadRequestError(
        MESSAGE.TEST.FULL_TEST_MISSING_SECTIONS,
        "FULL_TEST_MISSING_SECTIONS",
        {
          missing,
        },
      );
    }
  }
}

async function buildGeneratedSections(input: RandomBuildBody) {
  const timing = await getSystemDefaultTimes();
  const avoidIds = new Set(input.rules?.avoidUsedIds ?? []);
  const sections: TestSectionInput[] = [];
  const usedIds = new Set<string>(avoidIds);

  const buildOne = async (
    sectionType: test_section_type,
    filters?: { levelMin?: number; levelMax?: number; tagIds?: string[] },
  ) => {
    if (sectionType === test_section_type.READING_SET) {
      const candidates = await testRepository.findPublishedReadingCandidates({
        levelMin: filters?.levelMin,
        levelMax: filters?.levelMax,
        tagIds: filters?.tagIds,
        excludeIds: Array.from(usedIds),
      });

      if (candidates.length === 0) {
        throw new BadRequestError(
          MESSAGE.TEST.RANDOM_BUILD_NOT_ENOUGH_CONTENT,
          "RANDOM_BUILD_NOT_ENOUGH_READING",
        );
      }

      const picked = randomPick(candidates);
      usedIds.add(picked.id);

      sections.push({
        sectionType: "READING_SET",
        readingSetId: picked.id,
        sortOrder: sections.length + 1,
        partLabel: "READING",
        timeLimitSec: getDefaultTimeLimitBySectionType(
          test_section_type.READING_SET,
          timing,
        ),
      });

      return;
    }

    if (sectionType === test_section_type.LISTENING_SET) {
      const candidates = await testRepository.findPublishedListeningCandidates({
        levelMin: filters?.levelMin,
        levelMax: filters?.levelMax,
        tagIds: filters?.tagIds,
        excludeIds: Array.from(usedIds),
      });

      if (candidates.length === 0) {
        throw new BadRequestError(
          MESSAGE.TEST.RANDOM_BUILD_NOT_ENOUGH_CONTENT,
          "RANDOM_BUILD_NOT_ENOUGH_LISTENING",
        );
      }

      const picked = randomPick(candidates);
      usedIds.add(picked.id);

      sections.push({
        sectionType: "LISTENING_SET",
        listeningSetId: picked.id,
        sortOrder: sections.length + 1,
        partLabel: "LISTENING",
        timeLimitSec: getDefaultTimeLimitBySectionType(
          test_section_type.LISTENING_SET,
          timing,
        ),
      });

      return;
    }

    if (sectionType === test_section_type.WRITING_TASK) {
      const candidates = await testRepository.findPublishedWritingCandidates({
        levelMin: filters?.levelMin,
        levelMax: filters?.levelMax,
        tagIds: filters?.tagIds,
        excludeIds: Array.from(usedIds),
      });

      if (candidates.length === 0) {
        throw new BadRequestError(
          MESSAGE.TEST.RANDOM_BUILD_NOT_ENOUGH_CONTENT,
          "RANDOM_BUILD_NOT_ENOUGH_WRITING",
        );
      }

      const picked = randomPick(candidates);
      usedIds.add(picked.id);

      sections.push({
        sectionType: "WRITING_TASK",
        writingTaskId: picked.id,
        sortOrder: sections.length + 1,
        partLabel: "WRITING",
        timeLimitSec: getDefaultTimeLimitBySectionType(
          test_section_type.WRITING_TASK,
          timing,
        ),
      });

      return;
    }

    const candidates = await testRepository.findPublishedSpeakingCandidates({
      levelMin: filters?.levelMin,
      levelMax: filters?.levelMax,
      tagIds: filters?.tagIds,
      excludeIds: Array.from(usedIds),
    });

    if (candidates.length === 0) {
      throw new BadRequestError(
        MESSAGE.TEST.RANDOM_BUILD_NOT_ENOUGH_CONTENT,
        "RANDOM_BUILD_NOT_ENOUGH_SPEAKING",
      );
    }

    const picked = randomPick(candidates);
    usedIds.add(picked.id);

    sections.push({
      sectionType: "SPEAKING_SET",
      speakingSetId: picked.id,
      sortOrder: sections.length + 1,
      partLabel: "SPEAKING",
      timeLimitSec: getDefaultTimeLimitBySectionType(
        test_section_type.SPEAKING_SET,
        timing,
      ),
    });
  };

  const readingRule = input.rules?.reading ?? {
    levelMin: input.level ?? undefined,
    levelMax: input.level ?? undefined,
    tagIds: input.tagIds,
  };
  const listeningRule = input.rules?.listening ?? {
    levelMin: input.level ?? undefined,
    levelMax: input.level ?? undefined,
    tagIds: input.tagIds,
  };
  const writingRule = input.rules?.writing ?? {
    levelMin: input.level ?? undefined,
    levelMax: input.level ?? undefined,
    tagIds: input.tagIds,
  };
  const speakingRule = input.rules?.speaking ?? {
    levelMin: input.level ?? undefined,
    levelMax: input.level ?? undefined,
    tagIds: input.tagIds,
  };

  const type = input.type as test_type;

  if (type === test_type.FULL) {
    await buildOne(test_section_type.READING_SET, readingRule);
    await buildOne(test_section_type.LISTENING_SET, listeningRule);
    await buildOne(test_section_type.WRITING_TASK, writingRule);
    await buildOne(test_section_type.SPEAKING_SET, speakingRule);
  } else {
    const sectionType = getAllowedSectionTypeByTestType(type)!;
    const rule =
      sectionType === test_section_type.READING_SET
        ? readingRule
        : sectionType === test_section_type.LISTENING_SET
          ? listeningRule
          : sectionType === test_section_type.WRITING_TASK
            ? writingRule
            : speakingRule;

    await buildOne(sectionType, rule);
  }

  return sections;
}

export const testService = {
  async getPublicTests(query: TestListQuery) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      testRepository.findPublicTests({
        skip: pagination.skip,
        take: pagination.limit,
        search: query.search?.trim() || undefined,
        type: query.type as test_type | undefined,
        level: query.level,
        tagIds: query.tagIds,
      }),
      testRepository.countPublicTests({
        search: query.search?.trim() || undefined,
        type: query.type as test_type | undefined,
        level: query.level,
        tagIds: query.tagIds,
      }),
    ]);

    return {
      items: items.map(mapTestList),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getPublicTestDetail(id: string) {
    const test = await testRepository.findPublicTestDetail(id);

    if (!test) {
      throw new NotFoundError(MESSAGE.TEST.NOT_FOUND);
    }

    return mapPublicTestDetail(test);
  },

  async getAdminTests(query: TestListQuery) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      testRepository.findAdminTests({
        skip: pagination.skip,
        take: pagination.limit,
        search: query.search?.trim() || undefined,
        type: query.type as test_type | undefined,
        level: query.level,
        tagIds: query.tagIds,
        status: query.status as publish_status | undefined,
      }),
      testRepository.countAdminTests({
        search: query.search?.trim() || undefined,
        type: query.type as test_type | undefined,
        level: query.level,
        tagIds: query.tagIds,
        status: query.status as publish_status | undefined,
      }),
    ]);

    return {
      items: items.map(mapTestList),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getAdminTestDetail(id: string) {
    const test = await testRepository.findAdminTestDetail(id);

    if (!test) {
      throw new NotFoundError(MESSAGE.TEST.NOT_FOUND);
    }

    return mapAdminTestDetail(test);
  },

  async createTest(adminUserId: string, body: CreateTestBody) {
    const existing = await testRepository.findTestById(body.id);

    if (existing) {
      throw new ConflictError(MESSAGE.TEST.ID_EXISTS);
    }

    const tagIds = await assertTagsExist(body.tagIds);
    const sections = body.sections ?? [];

    await validateSectionsForDraft(body.type as test_type, sections);

    const created = await testRepository.createTest({
      id: body.id,
      type: body.type as test_type,
      title: normalizeText(body.title),
      level: body.level ?? null,
      description: normalizeNullableText(body.description),
      created_by: adminUserId,
      tagIds,
      sections: sections.map((section) => ({
        section_type: section.sectionType as test_section_type,
        reading_set_id: section.readingSetId ?? null,
        listening_set_id: section.listeningSetId ?? null,
        writing_task_id: section.writingTaskId ?? null,
        speaking_set_id: section.speakingSetId ?? null,
        part_label: normalizeNullableText(section.partLabel),
        sort_order: section.sortOrder,
        time_limit_sec: section.timeLimitSec ?? null,
      })),
    });

    if (body.publishNow) {
      await validateSectionsForPublish(body.id);
      const published = await testRepository.publishTest(body.id, adminUserId);
      await enqueueTestPublishedNotification(body.id);
      return mapAdminTestDetail(published!);
    }

    return mapAdminTestDetail(created!);
  },

  async updateTest(id: string, body: UpdateTestBody) {
    await assertTestMutable(id);

    const tagIds =
      body.tagIds !== undefined
        ? await assertTagsExist(body.tagIds)
        : undefined;

    const updated = await testRepository.updateTestMeta(id, {
      ...(body.title !== undefined ? { title: normalizeText(body.title) } : {}),
      ...(body.level !== undefined ? { level: body.level } : {}),
      ...(body.description !== undefined
        ? { description: normalizeNullableText(body.description) }
        : {}),
      ...(tagIds !== undefined ? { tagIds } : {}),
    });

    return mapAdminTestDetail(updated!);
  },

  async deleteTest(id: string) {
    const test = await testRepository.findTestById(id);

    if (!test) {
      throw new NotFoundError(MESSAGE.TEST.NOT_FOUND);
    }

    if (test.status === publish_status.PUBLISHED) {
      throw new ForbiddenError(MESSAGE.TEST.CANNOT_MUTATE_PUBLISHED);
    }

    const attemptCount = await testRepository.countAttemptsByTest(id);

    if (attemptCount > 0) {
      throw new ConflictError(MESSAGE.TEST.HAS_ATTEMPTS, "TEST_HAS_ATTEMPTS", {
        attemptCount,
      });
    }

    await testRepository.deleteTest(id);

    return {
      success: true,
    };
  },

  async replaceSections(testId: string, body: ReplaceSectionsBody) {
    const test = await assertTestMutable(testId);

    await validateSectionsForDraft(test.type as test_type, body.sections);

    const updated = await testRepository.replaceSections(
      testId,
      body.sections.map((section) => ({
        section_type: section.sectionType as test_section_type,
        reading_set_id: section.readingSetId ?? null,
        listening_set_id: section.listeningSetId ?? null,
        writing_task_id: section.writingTaskId ?? null,
        speaking_set_id: section.speakingSetId ?? null,
        part_label: normalizeNullableText(section.partLabel),
        sort_order: section.sortOrder,
        time_limit_sec: section.timeLimitSec ?? null,
      })),
    );

    return mapAdminTestDetail(updated!);
  },

  async addSection(testId: string, body: TestSectionInput) {
    const test = await assertTestMutable(testId);

    assertSectionCompatibility(
      test.type as test_type,
      body.sectionType as test_section_type,
    );
    await validateSectionSourceExists(body);

    const sortConflict = await testRepository.findSectionBySortOrder(
      testId,
      body.sortOrder,
    );
    if (sortConflict) {
      throw new ConflictError(MESSAGE.TEST.SECTION_SORT_ORDER_EXISTS);
    }

    const created = await testRepository.addSection({
      test_id: testId,
      section_type: body.sectionType as test_section_type,
      reading_set_id: body.readingSetId ?? null,
      listening_set_id: body.listeningSetId ?? null,
      writing_task_id: body.writingTaskId ?? null,
      speaking_set_id: body.speakingSetId ?? null,
      part_label: normalizeNullableText(body.partLabel),
      sort_order: body.sortOrder,
      time_limit_sec: body.timeLimitSec ?? null,
    });

    return mapSectionDetail(created);
  },

  async updateSection(sectionId: string, body: UpdateTestSectionBody) {
    const existing = await testRepository.findSectionById(sectionId);

    if (!existing) {
      throw new NotFoundError(MESSAGE.TEST.SECTION_NOT_FOUND);
    }

    if (existing.tests.status === publish_status.PUBLISHED) {
      throw new ForbiddenError(MESSAGE.TEST.CANNOT_MUTATE_PUBLISHED);
    }

    const merged = {
      sectionType: (body.sectionType ?? existing.section_type) as
        | "READING_SET"
        | "LISTENING_SET"
        | "WRITING_TASK"
        | "SPEAKING_SET",
      readingSetId:
        body.readingSetId !== undefined
          ? body.readingSetId
          : existing.reading_set_id,
      listeningSetId:
        body.listeningSetId !== undefined
          ? body.listeningSetId
          : existing.listening_set_id,
      writingTaskId:
        body.writingTaskId !== undefined
          ? body.writingTaskId
          : existing.writing_task_id,
      speakingSetId:
        body.speakingSetId !== undefined
          ? body.speakingSetId
          : existing.speaking_set_id,
    };

    assertSectionCompatibility(
      existing.tests.type as test_type,
      merged.sectionType as test_section_type,
    );
    await validateSectionSourceExists(merged);

    const nextSortOrder = body.sortOrder ?? existing.sort_order;
    const sortConflict = await testRepository.findSectionBySortOrder(
      existing.test_id,
      nextSortOrder,
      sectionId,
    );

    if (sortConflict) {
      throw new ConflictError(MESSAGE.TEST.SECTION_SORT_ORDER_EXISTS);
    }

    const updated = await testRepository.updateSection(sectionId, {
      ...(body.sectionType !== undefined
        ? { section_type: body.sectionType as test_section_type }
        : {}),
      ...(body.readingSetId !== undefined
        ? { reading_set_id: body.readingSetId }
        : {}),
      ...(body.listeningSetId !== undefined
        ? { listening_set_id: body.listeningSetId }
        : {}),
      ...(body.writingTaskId !== undefined
        ? { writing_task_id: body.writingTaskId }
        : {}),
      ...(body.speakingSetId !== undefined
        ? { speaking_set_id: body.speakingSetId }
        : {}),
      ...(body.partLabel !== undefined
        ? { part_label: normalizeNullableText(body.partLabel) }
        : {}),
      ...(body.sortOrder !== undefined ? { sort_order: body.sortOrder } : {}),
      ...(body.timeLimitSec !== undefined
        ? { time_limit_sec: body.timeLimitSec }
        : {}),
    });

    return mapSectionDetail(updated);
  },

  async deleteSection(sectionId: string) {
    const existing = await testRepository.findSectionById(sectionId);

    if (!existing) {
      throw new NotFoundError(MESSAGE.TEST.SECTION_NOT_FOUND);
    }

    if (existing.tests.status === publish_status.PUBLISHED) {
      throw new ForbiddenError(MESSAGE.TEST.CANNOT_MUTATE_PUBLISHED);
    }

    await testRepository.deleteSection(sectionId);

    return {
      success: true,
    };
  },

  async publishTest(testId: string, adminUserId: string) {
    const test = await testRepository.findTestById(testId);

    if (!test) {
      throw new NotFoundError(MESSAGE.TEST.NOT_FOUND);
    }

    await validateSectionsForPublish(testId);

    const published = await testRepository.publishTest(testId, adminUserId);
    await enqueueTestPublishedNotification(testId);

    return mapAdminTestDetail(published!);
  },

  async unpublishTest(testId: string) {
    const test = await testRepository.findTestById(testId);

    if (!test) {
      throw new NotFoundError(MESSAGE.TEST.NOT_FOUND);
    }

    const unpublished = await testRepository.unpublishTest(testId);

    return mapAdminTestDetail(unpublished);
  },

  async previewBuild(body: RandomBuildBody) {
    const sections = await buildGeneratedSections(body);

    return {
      id: body.id ?? null,
      type: body.type,
      title: normalizeText(body.title),
      level: body.level ?? null,
      description: normalizeNullableText(body.description) ?? null,
      tags: await assertTagsExist(body.tagIds),
      sections,
    };
  },

  async randomBuild(adminUserId: string, body: RandomBuildBody) {
    const id = body.id ?? generateTestId();
    const existing = await testRepository.findTestById(id);

    if (existing) {
      throw new ConflictError(MESSAGE.TEST.ID_EXISTS);
    }

    const sections = await buildGeneratedSections(body);
    const tagIds = await assertTagsExist(body.tagIds);

    const created = await testRepository.createTest({
      id,
      type: body.type as test_type,
      title: normalizeText(body.title),
      level: body.level ?? null,
      description: normalizeNullableText(body.description),
      created_by: adminUserId,
      tagIds,
      sections: sections.map((section) => ({
        section_type: section.sectionType as test_section_type,
        reading_set_id: section.readingSetId ?? null,
        listening_set_id: section.listeningSetId ?? null,
        writing_task_id: section.writingTaskId ?? null,
        speaking_set_id: section.speakingSetId ?? null,
        part_label: normalizeNullableText(section.partLabel),
        sort_order: section.sortOrder,
        time_limit_sec: section.timeLimitSec ?? null,
      })),
    });

    if (body.publishNow) {
      await validateSectionsForPublish(id);
      const published = await testRepository.publishTest(id, adminUserId);
      await enqueueTestPublishedNotification(id);
      return mapAdminTestDetail(published!);
    }

    return mapAdminTestDetail(created!);
  },

  async rerollSection(sectionId: string) {
    const section = await testRepository.findSectionById(sectionId);

    if (!section) {
      throw new NotFoundError(MESSAGE.TEST.SECTION_NOT_FOUND);
    }

    if (section.tests.status === publish_status.PUBLISHED) {
      throw new ForbiddenError(MESSAGE.TEST.CANNOT_MUTATE_PUBLISHED);
    }

    const allSections = await testRepository.findSectionsByTestId(
      section.test_id,
    );
    const currentType = section.section_type as test_section_type;
    const currentTest = section.tests;

    const excludeIds = allSections
      .filter((item) => item.section_type === currentType)
      .map((item) => {
        if (currentType === test_section_type.READING_SET)
          return item.reading_set_id;
        if (currentType === test_section_type.LISTENING_SET)
          return item.listening_set_id;
        if (currentType === test_section_type.WRITING_TASK)
          return item.writing_task_id;
        return item.speaking_set_id;
      })
      .filter((value): value is string => !!value);

    let patch: UpdateTestSectionBody;

    if (currentType === test_section_type.READING_SET) {
      const candidates = await testRepository.findPublishedReadingCandidates({
        levelMin: currentTest.level ? Number(currentTest.level) : undefined,
        levelMax: currentTest.level ? Number(currentTest.level) : undefined,
        excludeIds,
      });

      if (candidates.length === 0) {
        throw new BadRequestError(MESSAGE.TEST.REROLL_NOT_AVAILABLE);
      }

      patch = {
        sectionType: "READING_SET",
        readingSetId: randomPick(candidates).id,
        listeningSetId: null,
        writingTaskId: null,
        speakingSetId: null,
      };
    } else if (currentType === test_section_type.LISTENING_SET) {
      const candidates = await testRepository.findPublishedListeningCandidates({
        levelMin: currentTest.level ? Number(currentTest.level) : undefined,
        levelMax: currentTest.level ? Number(currentTest.level) : undefined,
        excludeIds,
      });

      if (candidates.length === 0) {
        throw new BadRequestError(MESSAGE.TEST.REROLL_NOT_AVAILABLE);
      }

      patch = {
        sectionType: "LISTENING_SET",
        readingSetId: null,
        listeningSetId: randomPick(candidates).id,
        writingTaskId: null,
        speakingSetId: null,
      };
    } else if (currentType === test_section_type.WRITING_TASK) {
      const candidates = await testRepository.findPublishedWritingCandidates({
        levelMin: currentTest.level ? Number(currentTest.level) : undefined,
        levelMax: currentTest.level ? Number(currentTest.level) : undefined,
        excludeIds,
      });

      if (candidates.length === 0) {
        throw new BadRequestError(MESSAGE.TEST.REROLL_NOT_AVAILABLE);
      }

      patch = {
        sectionType: "WRITING_TASK",
        readingSetId: null,
        listeningSetId: null,
        writingTaskId: randomPick(candidates).id,
        speakingSetId: null,
      };
    } else {
      const candidates = await testRepository.findPublishedSpeakingCandidates({
        levelMin: currentTest.level ? Number(currentTest.level) : undefined,
        levelMax: currentTest.level ? Number(currentTest.level) : undefined,
        excludeIds,
      });

      if (candidates.length === 0) {
        throw new BadRequestError(MESSAGE.TEST.REROLL_NOT_AVAILABLE);
      }

      patch = {
        sectionType: "SPEAKING_SET",
        readingSetId: null,
        listeningSetId: null,
        writingTaskId: null,
        speakingSetId: randomPick(candidates).id,
      };
    }

    return this.updateSection(sectionId, patch);
  },
};
