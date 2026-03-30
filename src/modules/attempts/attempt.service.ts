import {
  Prisma,
  attempt_status,
  speaking_part_type,
  test_type,
} from "@prisma/client";
import { DEFAULT_SYSTEM_CONFIG } from "../../common/constants/system-config.constant";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { ForbiddenError } from "../../common/errors/forbidden.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../common/utils/pagination";
import { countWords } from "../../common/utils/word-count";
import {
  mapAttemptListItem,
  mapAttemptResultDetail,
  mapQuestionAnswer,
  mapSpeakingResponse,
  mapTeacherReview,
  mapWritingResponse,
} from "./attempt.mapper";
import { attemptRepository } from "./attempt.repository";
import { gradeObjectiveQuestions } from "./grading.service";
import {
  AttemptListQuery,
  CreateAttemptBody,
  PatchQuestionAnswerBody,
  PatchSpeakingResponseBody,
  SaveQuestionAnswerItem,
  SaveSpeakingResponseItem,
  SaveWritingResponseItem,
  SubmitAttemptBody,
} from "./attempt.types";
import {
  enqueueSpeakingAsr,
  enqueueSpeakingAiGrading,
  enqueueWritingAiGrading,
} from "../../jobs/queues";
function aggregateGradingJobStatus(statuses: Array<string | null | undefined>) {
  const normalized = statuses.filter(Boolean) as string[];

  if (normalized.length === 0) return null;
  if (normalized.some((status) => status === "ERROR")) return "ERROR";
  if (normalized.some((status) => status === "RUNNING")) return "RUNNING";
  if (normalized.some((status) => status === "PENDING")) return "PENDING";
  return "DONE";
}

function aggregateTeacherStatus(statuses: Array<string | null | undefined>) {
  const normalized = statuses.filter(Boolean) as string[];

  if (normalized.length === 0) return null;
  if (normalized.some((status) => status === "PENDING")) return "PENDING";
  if (normalized.some((status) => status === "CLAIMED")) return "CLAIMED";
  return "REVIEWED";
}
function generateAttemptId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ATT_${ts}${rand}`.slice(0, 32);
}

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
function toJsonInput(
  value: unknown,
): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

function toNullableJsonInput(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null) {
    return Prisma.DbNull;
  }

  return value as Prisma.InputJsonValue;
}
function buildSnapshot(test: any) {
  return {
    test: {
      id: test.id,
      type: test.type,
      title: test.title,
      level: test.level ? Number(test.level) : null,
      status: test.status,
      description: test.description,
      publishedAt: test.published_at,
    },
    tags: test.test_tags.map((item: any) => ({
      id: item.tags.id,
      name: item.tags.name,
      slug: item.tags.slug,
    })),
    sections: test.test_sections.map((section: any) => ({
      id: section.id,
      sectionType: section.section_type,
      partLabel: section.part_label,
      sortOrder: section.sort_order,
      timeLimitSec: section.time_limit_sec,
      readingSet: section.reading_sets
        ? {
            id: section.reading_sets.id,
            title: section.reading_sets.title,
            passageHtml: section.reading_sets.passage_html,
            passageText: section.reading_sets.passage_text,
            level: section.reading_sets.level
              ? Number(section.reading_sets.level)
              : null,
            status: section.reading_sets.status,
            tags: section.reading_sets.reading_set_tags.map((item: any) => ({
              id: item.tags.id,
              name: item.tags.name,
              slug: item.tags.slug,
            })),
            questions: section.reading_sets.questions.map((q: any) => ({
              id: q.id,
              qNo: q.q_no,
              questionType: q.question_type,
              promptText: q.prompt_text,
              instructionText: q.instruction_text,
              optionsJson: q.options_json,
              correctAnswerJson: q.correct_answer_json,
              explanation: q.explanation,
              points: q.points ? Number(q.points) : 1,
              sortOrder: q.sort_order,
            })),
          }
        : null,
      listeningSet: section.listening_sets
        ? {
            id: section.listening_sets.id,
            title: section.listening_sets.title,
            transcriptText: section.listening_sets.transcript_text,
            audioUrl: section.listening_sets.audio_url,
            audioSource: section.listening_sets.audio_source,
            level: section.listening_sets.level
              ? Number(section.listening_sets.level)
              : null,
            status: section.listening_sets.status,
            tags: section.listening_sets.listening_set_tags.map(
              (item: any) => ({
                id: item.tags.id,
                name: item.tags.name,
                slug: item.tags.slug,
              }),
            ),
            questions: section.listening_sets.questions.map((q: any) => ({
              id: q.id,
              qNo: q.q_no,
              sectionLabel: q.section_label,
              questionType: q.question_type,
              promptText: q.prompt_text,
              instructionText: q.instruction_text,
              optionsJson: q.options_json,
              correctAnswerJson: q.correct_answer_json,
              explanation: q.explanation,
              points: q.points ? Number(q.points) : 1,
              sortOrder: q.sort_order,
            })),
          }
        : null,
      writingTask: section.writing_tasks
        ? {
            id: section.writing_tasks.id,
            taskNo: section.writing_tasks.task_no,
            title: section.writing_tasks.title,
            promptText: section.writing_tasks.prompt_text,
            chartUrl: section.writing_tasks.chart_url,
            imageUrl: section.writing_tasks.image_url,
            level: section.writing_tasks.level
              ? Number(section.writing_tasks.level)
              : null,
            status: section.writing_tasks.status,
            tags: section.writing_tasks.writing_task_tags.map((item: any) => ({
              id: item.tags.id,
              name: item.tags.name,
              slug: item.tags.slug,
            })),
          }
        : null,
      speakingSet: section.speaking_sets
        ? {
            id: section.speaking_sets.id,
            topic: section.speaking_sets.topic,
            level: section.speaking_sets.level
              ? Number(section.speaking_sets.level)
              : null,
            status: section.speaking_sets.status,
            tags: section.speaking_sets.speaking_set_tags.map((item: any) => ({
              id: item.tags.id,
              name: item.tags.name,
              slug: item.tags.slug,
            })),
            parts: section.speaking_sets.speaking_parts.map((part: any) => ({
              id: part.id,
              partType: part.part_type,
              title: part.title,
              instructions: part.instructions,
              recommendedSec: part.recommended_sec,
              sortOrder: part.sort_order,
              prompts: part.speaking_prompts.map((prompt: any) => ({
                id: prompt.id,
                promptType: prompt.prompt_type,
                content: prompt.content,
                notes: prompt.notes,
                timeSuggestSec: prompt.time_suggest_sec,
                sortOrder: prompt.sort_order,
                items: prompt.speaking_prompt_items.map((item: any) => ({
                  id: item.id,
                  itemText: item.item_text,
                  sortOrder: item.sort_order,
                })),
              })),
            })),
          }
        : null,
    })),
  };
}

function sanitizeSnapshotForSession(snapshot: any) {
  return {
    ...snapshot,
    sections: snapshot.sections.map((section: any) => ({
      ...section,
      readingSet: section.readingSet
        ? {
            ...section.readingSet,
            questions: section.readingSet.questions.map((q: any) => ({
              id: q.id,
              qNo: q.qNo,
              questionType: q.questionType,
              promptText: q.promptText,
              instructionText: q.instructionText,
              optionsJson: q.optionsJson,
              points: q.points,
              sortOrder: q.sortOrder,
            })),
          }
        : null,
      listeningSet: section.listeningSet
        ? {
            ...section.listeningSet,
            transcriptText: null,
            questions: section.listeningSet.questions.map((q: any) => ({
              id: q.id,
              qNo: q.qNo,
              sectionLabel: q.sectionLabel,
              questionType: q.questionType,
              promptText: q.promptText,
              instructionText: q.instructionText,
              optionsJson: q.optionsJson,
              points: q.points,
              sortOrder: q.sortOrder,
            })),
          }
        : null,
    })),
  };
}

function sectionTypeForMode(mode: test_type) {
  if (mode === test_type.READING) return "READING_SET";
  if (mode === test_type.LISTENING) return "LISTENING_SET";
  if (mode === test_type.WRITING) return "WRITING_TASK";
  if (mode === test_type.SPEAKING) return "SPEAKING_SET";
  return null;
}

function getRelevantSections(
  snapshot: any,
  mode: test_type,
  partLabel?: string | null,
) {
  let sections = snapshot.sections as any[];

  const singleSectionType = sectionTypeForMode(mode);

  if (singleSectionType) {
    sections = sections.filter(
      (section) => section.sectionType === singleSectionType,
    );
  }

  if (partLabel) {
    const filtered = sections.filter(
      (section) => section.partLabel === partLabel,
    );
    if (filtered.length > 0) {
      sections = filtered;
    }
  }

  return sections;
}

function collectQuestionIds(
  snapshot: any,
  mode: test_type,
  partLabel?: string | null,
) {
  const sections = getRelevantSections(snapshot, mode, partLabel);
  const ids = new Set<string>();

  for (const section of sections) {
    const readingQuestions = section.readingSet?.questions ?? [];
    const listeningQuestions = section.listeningSet?.questions ?? [];

    for (const question of [...readingQuestions, ...listeningQuestions]) {
      ids.add(question.id);
    }
  }

  return ids;
}

function collectWritingTaskIds(
  snapshot: any,
  mode: test_type,
  partLabel?: string | null,
) {
  const sections = getRelevantSections(snapshot, mode, partLabel);
  const ids = new Set<string>();

  for (const section of sections) {
    if (section.writingTask?.id) {
      ids.add(section.writingTask.id);
    }
  }

  return ids;
}

function collectSpeakingInfo(
  snapshot: any,
  mode: test_type,
  partLabel?: string | null,
) {
  const sections = getRelevantSections(snapshot, mode, partLabel);
  const parts = new Set<string>();
  const promptIds = new Map<string, string>();

  for (const section of sections) {
    const speakingSet = section.speakingSet;

    if (!speakingSet) continue;

    for (const part of speakingSet.parts ?? []) {
      parts.add(part.partType);

      for (const prompt of part.prompts ?? []) {
        promptIds.set(prompt.id, part.partType);
      }
    }
  }

  return {
    parts,
    promptIds,
  };
}

function computeRemainingTime(attempt: any) {
  if (!attempt.expires_at) return 0;
  const remaining = Math.floor(
    (new Date(attempt.expires_at).getTime() - Date.now()) / 1000,
  );
  return remaining > 0 ? remaining : 0;
}

function getPendingSkillsFromSnapshot(
  snapshot: any,
  mode: test_type,
  partLabel?: string | null,
) {
  const sections = getRelevantSections(snapshot, mode, partLabel);
  const pending: test_type[] = [];

  if (sections.some((section) => !!section.writingTask)) {
    pending.push(test_type.WRITING);
  }

  if (sections.some((section) => !!section.speakingSet)) {
    pending.push(test_type.SPEAKING);
  }

  return pending;
}

function validateModeAgainstTest(test: any, mode: test_type) {
  const testType = test.type as test_type;

  if (testType !== test_type.FULL) {
    return testType === mode;
  }

  if (mode === test_type.FULL) {
    return true;
  }

  const wanted = sectionTypeForMode(mode);
  return test.test_sections.some(
    (section: any) => section.section_type === wanted,
  );
}

function getTimingConfigValue(
  rows: Array<{ key: string; value_json: unknown }>,
  key: string,
  fallback: number,
) {
  const found = rows.find((row) => row.key === key);
  if (!found) return fallback;
  return Number(found.value_json);
}

async function getAttemptTimingByMode(mode: test_type) {
  const keys =
    mode === test_type.READING
      ? ["readingDefaultSec", "readingCustomMinSec", "readingCustomMaxSec"]
      : mode === test_type.LISTENING
        ? [
            "listeningDefaultSec",
            "listeningCustomMinSec",
            "listeningCustomMaxSec",
          ]
        : mode === test_type.WRITING
          ? ["writingDefaultSec", "writingCustomMinSec", "writingCustomMaxSec"]
          : mode === test_type.SPEAKING
            ? [
                "speakingDefaultSec",
                "speakingCustomMinSec",
                "speakingCustomMaxSec",
              ]
            : [
                "fullTestDefaultSec",
                "fullTestCustomMinSec",
                "fullTestCustomMaxSec",
              ];

  const rows = await attemptRepository.findSystemConfigRows(keys);

  if (mode === test_type.READING) {
    return {
      defaultSec: getTimingConfigValue(
        rows,
        "readingDefaultSec",
        DEFAULT_SYSTEM_CONFIG.readingDefaultSec,
      ),
      minSec: getTimingConfigValue(
        rows,
        "readingCustomMinSec",
        DEFAULT_SYSTEM_CONFIG.readingCustomMinSec,
      ),
      maxSec: getTimingConfigValue(
        rows,
        "readingCustomMaxSec",
        DEFAULT_SYSTEM_CONFIG.readingCustomMaxSec,
      ),
    };
  }

  if (mode === test_type.LISTENING) {
    return {
      defaultSec: getTimingConfigValue(
        rows,
        "listeningDefaultSec",
        DEFAULT_SYSTEM_CONFIG.listeningDefaultSec,
      ),
      minSec: getTimingConfigValue(
        rows,
        "listeningCustomMinSec",
        DEFAULT_SYSTEM_CONFIG.listeningCustomMinSec,
      ),
      maxSec: getTimingConfigValue(
        rows,
        "listeningCustomMaxSec",
        DEFAULT_SYSTEM_CONFIG.listeningCustomMaxSec,
      ),
    };
  }

  if (mode === test_type.WRITING) {
    return {
      defaultSec: getTimingConfigValue(
        rows,
        "writingDefaultSec",
        DEFAULT_SYSTEM_CONFIG.writingDefaultSec,
      ),
      minSec: getTimingConfigValue(
        rows,
        "writingCustomMinSec",
        DEFAULT_SYSTEM_CONFIG.writingCustomMinSec,
      ),
      maxSec: getTimingConfigValue(
        rows,
        "writingCustomMaxSec",
        DEFAULT_SYSTEM_CONFIG.writingCustomMaxSec,
      ),
    };
  }

  if (mode === test_type.SPEAKING) {
    return {
      defaultSec: getTimingConfigValue(
        rows,
        "speakingDefaultSec",
        DEFAULT_SYSTEM_CONFIG.speakingDefaultSec,
      ),
      minSec: getTimingConfigValue(
        rows,
        "speakingCustomMinSec",
        DEFAULT_SYSTEM_CONFIG.speakingCustomMinSec,
      ),
      maxSec: getTimingConfigValue(
        rows,
        "speakingCustomMaxSec",
        DEFAULT_SYSTEM_CONFIG.speakingCustomMaxSec,
      ),
    };
  }

  return {
    defaultSec: getTimingConfigValue(
      rows,
      "fullTestDefaultSec",
      DEFAULT_SYSTEM_CONFIG.fullTestDefaultSec,
    ),
    minSec: getTimingConfigValue(
      rows,
      "fullTestCustomMinSec",
      DEFAULT_SYSTEM_CONFIG.fullTestCustomMinSec,
    ),
    maxSec: getTimingConfigValue(
      rows,
      "fullTestCustomMaxSec",
      DEFAULT_SYSTEM_CONFIG.fullTestCustomMaxSec,
    ),
  };
}

async function syncExpireIfNeeded(attempt: any) {
  if (attempt.status === attempt_status.IN_PROGRESS && attempt.expires_at) {
    const expired = new Date(attempt.expires_at).getTime() <= Date.now();

    if (expired) {
      await attemptRepository.updateAttemptStatus(attempt.id, {
        status: attempt_status.EXPIRED,
      });
      attempt.status = attempt_status.EXPIRED;
    }
  }

  return attempt;
}

function ensureAttemptOwner(attempt: any, userId: string) {
  if (!attempt || attempt.user_id !== userId) {
    throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
  }
}

function ensureAttemptActive(attempt: any) {
  if (attempt.status === attempt_status.EXPIRED) {
    throw new BadRequestError(MESSAGE.ATTEMPT.EXPIRED);
  }

  if (attempt.status !== attempt_status.IN_PROGRESS) {
    throw new BadRequestError(MESSAGE.ATTEMPT.NOT_IN_PROGRESS);
  }
}

function buildResultSummary(params: {
  objective?: {
    correctCount: number;
    totalCount: number;
    rawScore: number;
    scaled40: number;
    bandEstimate: number;
  } | null;
  pendingSkills: test_type[];
}) {
  return {
    objective: params.objective,
    pendingSkills: params.pendingSkills,
  };
}

export const attemptService = {
  async createAttempt(userId: string, body: CreateAttemptBody) {
    const test = await attemptRepository.findPublishedTestWithContent(
      body.testId,
    );

    if (!test) {
      throw new BadRequestError(MESSAGE.ATTEMPT.TEST_NOT_PUBLISHED);
    }

    const mode = body.mode as test_type;

    if (!validateModeAgainstTest(test, mode)) {
      throw new BadRequestError(MESSAGE.ATTEMPT.MODE_NOT_SUPPORTED);
    }

    const timing = await getAttemptTimingByMode(mode);
    const chosenTime = body.timeLimitSec ?? timing.defaultSec;

    if (chosenTime < timing.minSec || chosenTime > timing.maxSec) {
      throw new BadRequestError(MESSAGE.ATTEMPT.INVALID_TIME_LIMIT);
    }

    const snapshot = buildSnapshot(test);
    const attemptId = generateAttemptId();
    const expiresAt = new Date(Date.now() + chosenTime * 1000);

    const created = await attemptRepository.createAttemptWithSnapshot({
      id: attemptId,
      user_id: userId,
      test_id: body.testId,
      mode,
      part_label: body.partLabel ?? null,
      time_limit_sec: chosenTime,
      expires_at: expiresAt,
      snapshot: snapshot as Prisma.InputJsonValue,
    });

    return {
      id: created.id,
      userId: created.user_id,
      testId: created.test_id,
      mode: created.mode,
      partLabel: created.part_label,
      timeLimitSec: created.time_limit_sec,
      startedAt: created.started_at,
      expiresAt: created.expires_at,
      status: created.status,
    };
  },

  async getAttempts(userId: string, query: AttemptListQuery) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    const [items, total] = await Promise.all([
      attemptRepository.findUserAttempts({
        userId,
        skip: pagination.skip,
        take: pagination.limit,
        mode: query.mode as test_type | undefined,
        status: query.status as attempt_status | undefined,
        from,
        to,
      }),
      attemptRepository.countUserAttempts({
        userId,
        mode: query.mode as test_type | undefined,
        status: query.status as attempt_status | undefined,
        from,
        to,
      }),
    ]);

    return {
      items: items.map(mapAttemptListItem),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getAttemptDetail(userId: string, attemptId: string) {
    const attempt = await attemptRepository.findUserAttemptById(
      attemptId,
      userId,
    );

    if (!attempt) {
      throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
    }

    await syncExpireIfNeeded(attempt);

    return {
      ...mapAttemptListItem(attempt),
      questionAnswers: attempt.attempt_question_answers.map(mapQuestionAnswer),
      writingResponses:
        attempt.attempt_writing_responses.map(mapWritingResponse),
      speakingResponses:
        attempt.attempt_speaking_responses.map(mapSpeakingResponse),
    };
  },

  async getAttemptSession(userId: string, attemptId: string) {
    const attempt = await attemptRepository.findUserAttemptById(
      attemptId,
      userId,
    );

    if (!attempt) {
      throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
    }

    await syncExpireIfNeeded(attempt);

    const snapshot = attempt.attempt_snapshots?.test_snapshot_json as any;

    if (!snapshot) {
      throw new NotFoundError(MESSAGE.ATTEMPT.SNAPSHOT_NOT_FOUND);
    }

    const sanitized = sanitizeSnapshotForSession(snapshot);

    return {
      attempt: {
        id: attempt.id,
        testId: attempt.test_id,
        mode: attempt.mode,
        partLabel: attempt.part_label,
        status: attempt.status,
        startedAt: attempt.started_at,
        expiresAt: attempt.expires_at,
        submittedAt: attempt.submitted_at,
        timeLimitSec: attempt.time_limit_sec,
        remainingTimeSec: computeRemainingTime(attempt),
      },
      snapshot: sanitized,
      savedAnswers: attempt.attempt_question_answers.map(mapQuestionAnswer),
      writingResponses:
        attempt.attempt_writing_responses.map(mapWritingResponse),
      speakingResponses:
        attempt.attempt_speaking_responses.map(mapSpeakingResponse),
    };
  },

  async saveQuestionAnswers(
    userId: string,
    attemptId: string,
    answers: SaveQuestionAnswerItem[],
  ) {
    const attempt = await attemptRepository.findUserAttemptById(
      attemptId,
      userId,
    );

    if (!attempt) {
      throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
    }

    await syncExpireIfNeeded(attempt);
    ensureAttemptOwner(attempt, userId);
    ensureAttemptActive(attempt);

    const snapshot = attempt.attempt_snapshots?.test_snapshot_json as any;
    const questionIds = collectQuestionIds(
      snapshot,
      attempt.mode,
      attempt.part_label,
    );

    for (const answer of answers) {
      if (!questionIds.has(answer.questionId)) {
        throw new BadRequestError(MESSAGE.ATTEMPT.QUESTION_NOT_IN_ATTEMPT);
      }
    }

    const saved = await attemptRepository.upsertQuestionAnswers(
      attemptId,
      answers.map((answer) => ({
        questionId: answer.questionId,
        qNo: answer.qNo,
        answerJson: toJsonInput(answer.answerJson),
        isFlagged: answer.isFlagged,
        isFinal: answer.isFinal,
      })),
    );

    return saved.map(mapQuestionAnswer);
  },

  async patchQuestionAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    body: PatchQuestionAnswerBody,
  ) {
    const saved = await this.saveQuestionAnswers(userId, attemptId, [
      {
        questionId,
        qNo: body.qNo,
        answerJson: body.answerJson ?? null,
        isFlagged: body.isFlagged,
        isFinal: body.isFinal,
      },
    ]);

    return saved[0];
  },

  async saveWritingResponses(
    userId: string,
    attemptId: string,
    responses: SaveWritingResponseItem[],
  ) {
    const attempt = await attemptRepository.findUserAttemptById(
      attemptId,
      userId,
    );

    if (!attempt) {
      throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
    }

    await syncExpireIfNeeded(attempt);
    ensureAttemptActive(attempt);

    const snapshot = attempt.attempt_snapshots?.test_snapshot_json as any;
    const taskIds = collectWritingTaskIds(
      snapshot,
      attempt.mode,
      attempt.part_label,
    );

    for (const response of responses) {
      if (!taskIds.has(response.writingTaskId)) {
        throw new BadRequestError(MESSAGE.ATTEMPT.WRITING_TASK_NOT_IN_ATTEMPT);
      }
    }

    const saved = await attemptRepository.upsertWritingResponses(
      attemptId,
      responses.map((response) => ({
        writingTaskId: response.writingTaskId,
        responseText: response.responseText,
        wordCount: countWords(response.responseText),
      })),
    );

    return saved.map(mapWritingResponse);
  },

  async saveSpeakingResponses(
    userId: string,
    attemptId: string,
    responses: SaveSpeakingResponseItem[],
  ) {
    const attempt = await attemptRepository.findUserAttemptById(
      attemptId,
      userId,
    );

    if (!attempt) {
      throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
    }

    await syncExpireIfNeeded(attempt);
    ensureAttemptActive(attempt);

    const snapshot = attempt.attempt_snapshots?.test_snapshot_json as any;
    const speakingInfo = collectSpeakingInfo(
      snapshot,
      attempt.mode,
      attempt.part_label,
    );

    for (const response of responses) {
      if (!speakingInfo.parts.has(response.speakingPart)) {
        throw new BadRequestError(MESSAGE.ATTEMPT.SPEAKING_PART_NOT_IN_ATTEMPT);
      }

      if (response.promptId && !speakingInfo.promptIds.has(response.promptId)) {
        throw new BadRequestError(
          MESSAGE.ATTEMPT.SPEAKING_PROMPT_NOT_IN_ATTEMPT,
        );
      }

      if (
        response.promptId &&
        speakingInfo.promptIds.get(response.promptId) !== response.speakingPart
      ) {
        throw new BadRequestError(
          MESSAGE.ATTEMPT.SPEAKING_PROMPT_NOT_IN_ATTEMPT,
        );
      }
    }

    const saved = await attemptRepository.upsertSpeakingResponses(
      attemptId,
      responses.map((response) => ({
        speakingPart: response.speakingPart as speaking_part_type,
        promptId: response.promptId ?? null,
        audioUrl: response.audioUrl,
        durationSec: response.durationSec ?? null,
      })),
    );

    return saved.map(mapSpeakingResponse);
  },

  async patchSpeakingResponse(
    userId: string,
    attemptId: string,
    speakingPart: speaking_part_type,
    body: PatchSpeakingResponseBody,
  ) {
    const attempt = await attemptRepository.findUserAttemptById(
      attemptId,
      userId,
    );

    if (!attempt) {
      throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
    }

    await syncExpireIfNeeded(attempt);
    ensureAttemptActive(attempt);

    const snapshot = attempt.attempt_snapshots?.test_snapshot_json as any;
    const speakingInfo = collectSpeakingInfo(
      snapshot,
      attempt.mode,
      attempt.part_label,
    );

    if (!speakingInfo.parts.has(speakingPart)) {
      throw new BadRequestError(MESSAGE.ATTEMPT.SPEAKING_PART_NOT_IN_ATTEMPT);
    }

    if (body.promptId && !speakingInfo.promptIds.has(body.promptId)) {
      throw new BadRequestError(MESSAGE.ATTEMPT.SPEAKING_PROMPT_NOT_IN_ATTEMPT);
    }

    if (
      body.promptId &&
      speakingInfo.promptIds.get(body.promptId) !== speakingPart
    ) {
      throw new BadRequestError(MESSAGE.ATTEMPT.SPEAKING_PROMPT_NOT_IN_ATTEMPT);
    }

    const existing = await attemptRepository.findSpeakingResponseByPart(
      attemptId,
      speakingPart,
    );

    if (!existing) {
      throw new NotFoundError(MESSAGE.ATTEMPT.SPEAKING_PART_NOT_IN_ATTEMPT);
    }

    await attemptRepository.updateSpeakingResponseByPart(
      attemptId,
      speakingPart,
      {
        ...(body.promptId !== undefined ? { prompt_id: body.promptId } : {}),
        ...(body.audioUrl !== undefined ? { audio_url: body.audioUrl } : {}),
        ...(body.durationSec !== undefined
          ? { duration_sec: body.durationSec }
          : {}),
        ...(body.transcript !== undefined
          ? { transcript: normalizeNullableText(body.transcript) }
          : {}),
      },
    );

    const updated = await attemptRepository.findSpeakingResponseByPart(
      attemptId,
      speakingPart,
    );
    return mapSpeakingResponse(updated);
  },

  async submitAttempt(
    userId: string,
    attemptId: string,
    body: SubmitAttemptBody,
  ) {
    const attempt = await attemptRepository.findUserAttemptById(
      attemptId,
      userId,
    );

    if (!attempt) {
      throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
    }

    await syncExpireIfNeeded(attempt);

    if (
      attempt.status === attempt_status.SUBMITTED ||
      attempt.status === attempt_status.GRADING ||
      attempt.status === attempt_status.GRADED
    ) {
      throw new BadRequestError(MESSAGE.ATTEMPT.ALREADY_SUBMITTED);
    }

    if (attempt.status === attempt_status.EXPIRED && !body.force) {
      throw new BadRequestError(MESSAGE.ATTEMPT.FORCE_REQUIRED_AFTER_EXPIRY);
    }

    const snapshot = attempt.attempt_snapshots?.test_snapshot_json as any;

    if (!snapshot) {
      throw new NotFoundError(MESSAGE.ATTEMPT.SNAPSHOT_NOT_FOUND);
    }

    const relevantSections = getRelevantSections(
      snapshot,
      attempt.mode,
      attempt.part_label,
    );
    const objectiveQuestions = relevantSections.flatMap((section: any) => [
      ...(section.readingSet?.questions ?? []),
      ...(section.listeningSet?.questions ?? []),
    ]);

    const pendingSkills = getPendingSkillsFromSnapshot(
      snapshot,
      attempt.mode,
      attempt.part_label,
    );

    await attemptRepository.updateAttemptStatus(attemptId, {
      submitted_at: new Date(),
      status:
        pendingSkills.length > 0 || objectiveQuestions.length > 0
          ? attempt_status.GRADING
          : attempt_status.SUBMITTED,
    });

    let objectiveSummary: {
      correctCount: number;
      totalCount: number;
      rawScore: number;
      scaled40: number;
      bandEstimate: number;
    } | null = null;

    if (objectiveQuestions.length > 0) {
      const skill =
        relevantSections.some((section: any) => !!section.readingSet) &&
        !relevantSections.some((section: any) => !!section.listeningSet)
          ? "READING"
          : relevantSections.some((section: any) => !!section.listeningSet) &&
              !relevantSections.some((section: any) => !!section.readingSet)
            ? "LISTENING"
            : null;

      if (skill) {
        const graded = gradeObjectiveQuestions({
          questions: objectiveQuestions.map((question: any) => ({
            id: question.id,
            qNo: question.qNo,
            correctAnswerJson: question.correctAnswerJson,
            explanation: question.explanation,
            points: question.points,
          })),
          answers: attempt.attempt_question_answers,
          skill,
        });

        objectiveSummary = {
          correctCount: graded.correctCount,
          totalCount: graded.totalCount,
          rawScore: graded.rawScore,
          scaled40: graded.scaled40,
          bandEstimate: graded.bandEstimate,
        };

        await attemptRepository.replaceAttemptResults(
          attemptId,
          {
            correct_count: graded.correctCount,
            total_count: graded.totalCount,
            raw_score: graded.rawScore,
            band_estimate:
              pendingSkills.length === 0 ? graded.bandEstimate : null,
            summary_json: toNullableJsonInput(
              buildResultSummary({
                objective: objectiveSummary,
                pendingSkills,
              }),
            ),
          },
          graded.details.map((detail) => ({
            question_id: detail.questionId,
            q_no: detail.qNo,
            user_answer_json: toNullableJsonInput(
              detail.userAnswerJson ?? null,
            ),
            correct_json: toNullableJsonInput(detail.correctJson ?? null),
            is_correct: detail.isCorrect,
            points_awarded: detail.pointsAwarded,
            explanation: detail.explanation,
          })),
        );
      }
    }

    if (pendingSkills.includes(test_type.WRITING)) {
      await attemptRepository.createTeacherSubmissions(attemptId, [
        test_type.WRITING,
      ]);
      await attemptRepository.createPendingWritingAiGrading(attemptId);
      await enqueueWritingAiGrading(attemptId);
    }

    if (pendingSkills.includes(test_type.SPEAKING)) {
      await attemptRepository.createTeacherSubmissions(attemptId, [
        test_type.SPEAKING,
      ]);
      await attemptRepository.createPendingSpeakingAsrJob(attemptId);
      await attemptRepository.createPendingSpeakingAiGrading(attemptId);
      await enqueueSpeakingAsr(attemptId);
    }

    const finalStatus =
      pendingSkills.length > 0
        ? attempt_status.GRADING
        : objectiveQuestions.length > 0
          ? attempt_status.GRADED
          : attempt_status.SUBMITTED;

    await attemptRepository.updateAttemptStatus(attemptId, {
      status: finalStatus,
      graded_at: finalStatus === attempt_status.GRADED ? new Date() : null,
    });

    const finalAttempt = await attemptRepository.findUserAttemptById(
      attemptId,
      userId,
    );

    return {
      attemptId,
      status: finalStatus,
      objectiveSummary,
      pendingSkills,
      submittedAt: finalAttempt?.submitted_at ?? null,
      gradedAt: finalAttempt?.graded_at ?? null,
    };
  },

  async getAttemptResult(userId: string, attemptId: string) {
    const attempt = await attemptRepository.findUserAttemptById(
      attemptId,
      userId,
    );

    if (!attempt) {
      throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
    }

    await syncExpireIfNeeded(attempt);

    const latestWritingAi =
      attempt.ai_gradings.find((item) => item.skill === test_type.WRITING) ??
      null;
    const latestSpeakingAi =
      attempt.ai_gradings.find((item) => item.skill === test_type.SPEAKING) ??
      null;
    const latestAsr = attempt.asr_jobs[0] ?? null;

    return {
      attemptId: attempt.id,
      status: attempt.status,
      submittedAt: attempt.submitted_at,
      gradedAt: attempt.graded_at,
      resultSummary: attempt.attempt_results
        ? {
            correctCount: attempt.attempt_results.correct_count,
            totalCount: attempt.attempt_results.total_count,
            rawScore: attempt.attempt_results.raw_score
              ? Number(attempt.attempt_results.raw_score)
              : null,
            bandEstimate: attempt.attempt_results.band_estimate
              ? Number(attempt.attempt_results.band_estimate)
              : null,
            summaryJson: attempt.attempt_results.summary_json,
          }
        : null,
      detail: attempt.attempt_result_details.map(mapAttemptResultDetail),
      teacherSubmissions: attempt.teacher_submissions.map((item) => ({
        id: item.id,
        skill: item.skill,
        status: item.status,
        claimedBy: item.claimed_by,
        claimedAt: item.claimed_at,
        reviewedAt: item.reviewed_at,
      })),
      teacherReviews: attempt.teacher_submissions
        .flatMap((item) => item.teacher_reviews ?? [])
        .map(mapTeacherReview),
      gradingJobs: {
        asrStatus: latestAsr?.status ?? null,
        writingAiStatus: latestWritingAi?.status ?? null,
        speakingAiStatus: latestSpeakingAi?.status ?? null,
      },
    };
  },

  async getAttemptReview(userId: string, attemptId: string) {
    const attempt = await attemptRepository.findUserAttemptById(
      attemptId,
      userId,
    );

    if (!attempt) {
      throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
    }

    const snapshot = attempt.attempt_snapshots?.test_snapshot_json as any;

    if (!snapshot) {
      throw new NotFoundError(MESSAGE.ATTEMPT.SNAPSHOT_NOT_FOUND);
    }

    return {
      attempt: {
        id: attempt.id,
        mode: attempt.mode,
        partLabel: attempt.part_label,
        status: attempt.status,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        gradedAt: attempt.graded_at,
      },
      snapshot: sanitizeSnapshotForSession(snapshot),
      questionAnswers: attempt.attempt_question_answers.map(mapQuestionAnswer),
      writingResponses:
        attempt.attempt_writing_responses.map(mapWritingResponse),
      speakingResponses:
        attempt.attempt_speaking_responses.map(mapSpeakingResponse),
      resultSummary: attempt.attempt_results
        ? {
            correctCount: attempt.attempt_results.correct_count,
            totalCount: attempt.attempt_results.total_count,
            rawScore: attempt.attempt_results.raw_score
              ? Number(attempt.attempt_results.raw_score)
              : null,
            bandEstimate: attempt.attempt_results.band_estimate
              ? Number(attempt.attempt_results.band_estimate)
              : null,
            summaryJson: attempt.attempt_results.summary_json,
          }
        : null,
      resultDetails: attempt.attempt_result_details.map(mapAttemptResultDetail),
      teacherReviews: attempt.teacher_submissions
        .flatMap((item) => item.teacher_reviews ?? [])
        .map(mapTeacherReview),
    };
  },

  async expireAttempt(attemptId: string) {
    const attempt = await attemptRepository.findAttemptById(attemptId);

    if (!attempt) {
      throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
    }

    if (attempt.status !== attempt_status.IN_PROGRESS) {
      throw new BadRequestError(MESSAGE.ATTEMPT.NOT_IN_PROGRESS);
    }

    await attemptRepository.updateAttemptStatus(attemptId, {
      status: attempt_status.EXPIRED,
    });

    return {
      success: true,
    };
  },
  async getAttemptGradingStatus(
    userId: string,
    role: string,
    attemptId: string,
  ) {
    const attempt = await attemptRepository.findAttemptById(attemptId);

    if (!attempt) {
      throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
    }

    if (role !== "ADMIN" && role !== "TEACHER" && attempt.user_id !== userId) {
      throw new NotFoundError(MESSAGE.ATTEMPT.NOT_FOUND);
    }

    await syncExpireIfNeeded(attempt);

    const latestAsr = attempt.asr_jobs[0] ?? null;
    const writingAiJobs = attempt.ai_gradings.filter(
      (item) => item.skill === test_type.WRITING,
    );
    const speakingAiJobs = attempt.ai_gradings.filter(
      (item) => item.skill === test_type.SPEAKING,
    );

    const teacherStatuses = attempt.teacher_submissions.map(
      (item) => item.status,
    );

    return {
      attemptId: attempt.id,
      status: attempt.status,
      asrStatus: latestAsr?.status ?? null,
      aiStatus: aggregateGradingJobStatus([
        ...writingAiJobs.map((item) => item.status),
        ...speakingAiJobs.map((item) => item.status),
      ]),
      teacherStatus: aggregateTeacherStatus(teacherStatuses),
      writingAiStatus: aggregateGradingJobStatus(
        writingAiJobs.map((item) => item.status),
      ),
      speakingAiStatus: aggregateGradingJobStatus(
        speakingAiJobs.map((item) => item.status),
      ),
      teacherSubmissions: attempt.teacher_submissions.map((item) => ({
        id: item.id,
        skill: item.skill,
        status: item.status,
        claimedBy: item.claimed_by,
        claimedAt: item.claimed_at,
        reviewedAt: item.reviewed_at,
      })),
    };
  },
};
