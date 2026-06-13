import * as XLSX from "xlsx";
import {
  Prisma,
  audio_source_type,
  publish_status,
  question_type,
  speaking_part_type,
  speaking_prompt_type,
  test_section_type,
  test_type,
} from "@prisma/client";
import { prisma } from "../../config/prisma";

type SheetRow = Record<string, unknown>;

function getSheetRows(workbook: XLSX.WorkBook, sheetName: string): SheetRow[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  return XLSX.utils.sheet_to_json<SheetRow>(sheet, {
    defval: null,
  });
}

function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const result = String(value).trim();
  return result || null;
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asJson(value: unknown): unknown {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(String(value));
  } catch {
    return String(value);
  }
}

function toNullableJsonField(
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
}

function toRequiredJsonField(
  value: unknown,
  fallback: Prisma.InputJsonValue,
): Prisma.InputJsonValue | Prisma.JsonNullValueInput {
  if (value === null || value === undefined) return fallback;
  return value as Prisma.InputJsonValue;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanStringArray(values: unknown[]): string[] {
  return values.map((item) => String(item).trim()).filter(Boolean);
}

function extractAnswerValues(value: unknown): string[] {
  if (value === null || value === undefined || value === "") return [];

  if (Array.isArray(value)) {
    return cleanStringArray(value.flatMap((item) => extractAnswerValues(item)));
  }

  if (isRecord(value)) {
    if ("values" in value) return extractAnswerValues(value.values);
    if ("answers" in value) return extractAnswerValues(value.answers);
    if ("value" in value) return extractAnswerValues(value.value);
    if ("answer" in value) return extractAnswerValues(value.answer);
    return [];
  }

  return cleanStringArray([value]);
}

function parseCorrectAnswerJson(
  value: unknown,
  questionType?: question_type,
): Prisma.InputJsonValue {
  const parsed = asJson(value);

  if (parsed === null || parsed === undefined || parsed === "") {
    return {};
  }

  if (Array.isArray(parsed) || isRecord(parsed)) {
    return parsed as Prisma.InputJsonValue;
  }

  const raw = String(parsed).trim();

  if (!raw) {
    return {};
  }

  // For IELTS multiple choice with more than one answer, allow Excel authors
  // to type A,C or A|C instead of strict JSON ["A","C"]. Do not apply this
  // to SHORT_ANSWER/FILL_BLANK because commas can be part of the real answer.
  if (questionType === question_type.MULTIPLE_CHOICE && /[,|;]/.test(raw)) {
    return raw
      .split(/[,|;]/)
      .map((item) => item.trim())
      .filter(Boolean) as Prisma.InputJsonValue;
  }

  return raw as Prisma.InputJsonValue;
}

function normalizeMultipleChoiceOptionsJson(
  optionsJson: unknown,
  correctAnswerJson: unknown,
): unknown {
  const answerCount = extractAnswerValues(correctAnswerJson).length;

  if (answerCount <= 1) {
    return optionsJson;
  }

  const maxSelections = answerCount;

  // Learner session intentionally hides correctAnswerJson, so the UI needs
  // a non-sensitive flag in optionsJson to know whether to render checkboxes.
  if (Array.isArray(optionsJson)) {
    return {
      multiple: true,
      minSelections: maxSelections,
      maxSelections,
      items: optionsJson,
    };
  }

  if (isRecord(optionsJson)) {
    return {
      ...optionsJson,
      multiple: true,
      minSelections:
        Number(optionsJson.minSelections) > 0
          ? Number(optionsJson.minSelections)
          : maxSelections,
      maxSelections:
        Number(optionsJson.maxSelections) > 0
          ? Number(optionsJson.maxSelections)
          : maxSelections,
    };
  }

  return {
    multiple: true,
    minSelections: maxSelections,
    maxSelections,
    items: [],
  };
}

function normalizeOptionsJsonForImport(
  optionsValue: unknown,
  questionType: question_type,
  correctAnswerJson: unknown,
): unknown {
  const parsedOptions = asJson(optionsValue);

  if (questionType !== question_type.MULTIPLE_CHOICE) {
    return parsedOptions;
  }

  return normalizeMultipleChoiceOptionsJson(parsedOptions, correctAnswerJson);
}

function parseTagSlugs(value: unknown) {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pickString(row: SheetRow, keys: string[]) {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return null;
}

function buildHtmlFromPlainText(text: string) {
  return text
    .split(/\n{2,}/)
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`,
    )
    .join("\n");
}

function buildReadingPassageSection(row: SheetRow, passageNo: number) {
  const title = pickString(row, [
    `passage_${passageNo}_title`,
    `passage${passageNo}_title`,
    `passage_${passageNo}_heading`,
    `passage${passageNo}_heading`,
  ]);

  const html = pickString(row, [
    `passage_${passageNo}_html`,
    `passage${passageNo}_html`,
  ]);

  const text = pickString(row, [
    `passage_${passageNo}_text`,
    `passage${passageNo}_text`,
  ]);

  const imageUrl = pickString(row, [
    `passage_${passageNo}_image_url`,
    `passage${passageNo}_image_url`,
    `passage_${passageNo}_img_url`,
    `passage${passageNo}_img_url`,
  ]);

  if (!title && !html && !text && !imageUrl) {
    return null;
  }

  const parts: string[] = [];

  if (title) {
    parts.push(`<h2>${escapeHtml(title)}</h2>`);
  }

  if (html) {
    parts.push(html);
  } else if (text) {
    parts.push(buildHtmlFromPlainText(text));
  }

  if (imageUrl) {
    parts.push(
      `<img src="${escapeHtml(imageUrl)}" alt="Reading passage ${passageNo}" />`,
    );
  }

  return `<section data-passage="${passageNo}">\n${parts.join("\n")}\n</section>`;
}

function buildReadingPassageHtml(row: SheetRow) {
  const existingHtml = asString(row.passage_html);

  if (existingHtml?.includes("data-passage=")) {
    return existingHtml;
  }

  const passageSections = [1, 2, 3]
    .map((passageNo) => buildReadingPassageSection(row, passageNo))
    .filter(Boolean);

  if (passageSections.length > 0) {
    return passageSections.join("\n\n");
  }

  return existingHtml;
}

function validateQuestionRows(
  questionRows: SheetRow[],
  owner: "reading" | "listening",
) {
  const seen = new Set<number>();

  for (const row of questionRows) {
    const qNo = asNumber(row.q_no);

    if (!qNo || !Number.isInteger(qNo)) {
      throw new Error(`${owner} questions require integer q_no`);
    }

    if (qNo < 1 || qNo > 40) {
      throw new Error(
        `${owner} q_no must be from 1 to 40. Invalid q_no: ${qNo}`,
      );
    }

    if (seen.has(qNo)) {
      throw new Error(`${owner} has duplicated q_no: ${qNo}`);
    }

    seen.add(qNo);

    parseEnumValue(question_type, row.question_type, "question_type");
  }
}

function buildQuestionCreateData(item: SheetRow) {
  const parsedQuestionType = parseEnumValue(
    question_type,
    item.question_type,
    "question_type",
  );

  const correctAnswerJson = parseCorrectAnswerJson(
    item.correct_answer_json,
    parsedQuestionType,
  );

  const optionsJson = normalizeOptionsJsonForImport(
    item.options_json,
    parsedQuestionType,
    correctAnswerJson,
  );

  return {
    section_label: asString(item.section_label),
    q_no: Number(item.q_no),
    question_type: parsedQuestionType,
    prompt_text: String(item.prompt_text || ""),
    instruction_text: asString(item.instruction_text),
    options_json: toNullableJsonField(optionsJson),
    correct_answer_json: toRequiredJsonField(correctAnswerJson, {}),
    explanation: asString(item.explanation),
    points: asNumber(item.points) ?? 1,
    sort_order: Number(item.sort_order || item.q_no || 1),
  };
}

function looksLikeCombinedWritingTask(promptText: string) {
  const normalized = promptText.toLowerCase();

  return (
    normalized.includes("task 1") &&
    normalized.includes("task 2") &&
    normalized.indexOf("task 1") !== normalized.indexOf("task 2")
  );
}

function parseSpeakingPartTypeForImport(value: unknown, fallback: unknown) {
  const raw = asString(value) || asString(fallback);

  if (!raw) {
    throw new Error("part_type or part_no is required");
  }

  if (Object.values(speaking_part_type).includes(raw as speaking_part_type)) {
    return raw as speaking_part_type;
  }

  const normalized = raw.toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");

  if (["1", "PART1", "PART_1"].includes(normalized)) {
    return speaking_part_type.PART_1;
  }

  if (["2", "PART2", "PART_2"].includes(normalized)) {
    return speaking_part_type.PART_2;
  }

  if (["3", "PART3", "PART_3"].includes(normalized)) {
    return speaking_part_type.PART_3;
  }

  throw new Error(`Invalid speaking part_type: ${raw}`);
}
function parseEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
  fieldName: string,
): T[keyof T] {
  const normalized = asString(value);

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  if (!Object.values(enumObject).includes(normalized as T[keyof T])) {
    throw new Error(`Invalid ${fieldName}: ${normalized}`);
  }

  return normalized as T[keyof T];
}

function parseNullableEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
  fieldName: string,
): T[keyof T] | null {
  const normalized = asString(value);

  if (!normalized) return null;

  if (!Object.values(enumObject).includes(normalized as T[keyof T])) {
    throw new Error(`Invalid ${fieldName}: ${normalized}`);
  }

  return normalized as T[keyof T];
}

async function resolveTagIdsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];

  const tags = await prisma.tags.findMany({
    where: {
      slug: {
        in: slugs,
      },
    },
  });

  return tags.map((tag) => tag.id);
}

async function importReadingSet(workbook: XLSX.WorkBook) {
  const setRows = getSheetRows(workbook, "reading_set");
  const questionRows = getSheetRows(workbook, "questions");

  if (setRows.length === 0) {
    throw new Error("reading_set sheet is empty");
  }

  const row = setRows[0];
  const id = asString(row.id);
  const title = asString(row.title);

  if (!id || !title) {
    throw new Error("reading_set requires id and title");
  }

  const tagIds = await resolveTagIdsBySlugs(parseTagSlugs(row.tag_slugs));

  await prisma.$transaction(async (tx) => {
    await tx.reading_sets.upsert({
      where: { id },
      update: {
        title,
        passage_html: buildReadingPassageHtml(row),
        passage_text: asString(row.passage_text),
        level: asNumber(row.level),
        status: parseEnumValue(publish_status, row.status ?? "DRAFT", "status"),
        updated_at: new Date(),
      },
      create: {
        id,
        title,
        passage_html: buildReadingPassageHtml(row),
        passage_text: asString(row.passage_text),
        level: asNumber(row.level),
        status: parseEnumValue(publish_status, row.status ?? "DRAFT", "status"),
      },
    });

    await tx.reading_set_tags.deleteMany({
      where: { reading_set_id: id },
    });

    if (tagIds.length > 0) {
      await tx.reading_set_tags.createMany({
        data: tagIds.map((tagId) => ({
          reading_set_id: id,
          tag_id: tagId,
        })),
      });
    }

    await tx.questions.deleteMany({
      where: {
        reading_set_id: id,
      },
    });

    if (questionRows.length > 0) {
      validateQuestionRows(questionRows, "reading");

      await tx.questions.createMany({
        data: questionRows.map((item) => ({
          reading_set_id: id,
          ...buildQuestionCreateData(item),
        })),
      });
    }
  });

  return {
    type: "READING_SET",
    id,
    questionCount: questionRows.length,
  };
}

async function importListeningSet(workbook: XLSX.WorkBook) {
  const setRows = getSheetRows(workbook, "listening_set");
  const questionRows = getSheetRows(workbook, "questions");

  if (setRows.length === 0) {
    throw new Error("listening_set sheet is empty");
  }

  const row = setRows[0];
  const id = asString(row.id);
  const title = asString(row.title);

  if (!id || !title) {
    throw new Error("listening_set requires id and title");
  }

  const tagIds = await resolveTagIdsBySlugs(parseTagSlugs(row.tag_slugs));

  await prisma.$transaction(async (tx) => {
    await tx.listening_sets.upsert({
      where: { id },
      update: {
        title,
        transcript_text: asString(row.transcript_text),
        audio_url: asString(row.audio_url),
        audio_source: parseNullableEnumValue(
          audio_source_type,
          row.audio_source,
          "audio_source",
        ),
        level: asNumber(row.level),
        status: parseEnumValue(publish_status, row.status ?? "DRAFT", "status"),
        updated_at: new Date(),
      },
      create: {
        id,
        title,
        transcript_text: asString(row.transcript_text),
        audio_url: asString(row.audio_url),
        audio_source: parseNullableEnumValue(
          audio_source_type,
          row.audio_source,
          "audio_source",
        ),
        level: asNumber(row.level),
        status: parseEnumValue(publish_status, row.status ?? "DRAFT", "status"),
      },
    });

    await tx.listening_set_tags.deleteMany({
      where: { listening_set_id: id },
    });

    if (tagIds.length > 0) {
      await tx.listening_set_tags.createMany({
        data: tagIds.map((tagId) => ({
          listening_set_id: id,
          tag_id: tagId,
        })),
      });
    }

    await tx.questions.deleteMany({
      where: {
        listening_set_id: id,
      },
    });

    if (questionRows.length > 0) {
      validateQuestionRows(questionRows, "listening");

      await tx.questions.createMany({
        data: questionRows.map((item) => ({
          listening_set_id: id,
          ...buildQuestionCreateData(item),
        })),
      });
    }
  });

  return {
    type: "LISTENING_SET",
    id,
    questionCount: questionRows.length,
  };
}

async function importWritingTask(workbook: XLSX.WorkBook) {
  const rows = getSheetRows(workbook, "writing_task");

  if (rows.length === 0) {
    throw new Error("writing_task sheet is empty");
  }

  const importedIds: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const id = asString(row.id);
      const title = asString(row.title);
      const promptText = asString(row.prompt_text);

      if (!id || !title || !promptText) {
        throw new Error("writing_task requires id, title, prompt_text");
      }

      if (looksLikeCombinedWritingTask(promptText)) {
        throw new Error(
          `Writing task ${id} appears to contain both Task 1 and Task 2. Please split them into two rows.`,
        );
      }

      const taskNo = asNumber(row.task_no);

      if (taskNo !== null && ![1, 2].includes(taskNo)) {
        throw new Error(
          `writing_task task_no must be 1 or 2. Invalid id: ${id}`,
        );
      }

      const tagIds = await resolveTagIdsBySlugs(parseTagSlugs(row.tag_slugs));

      await tx.writing_tasks.upsert({
        where: { id },
        update: {
          task_no: taskNo,
          title,
          prompt_text: promptText,
          chart_url: asString(row.chart_url),
          image_url: asString(row.image_url),
          level: asNumber(row.level),
          status: parseEnumValue(
            publish_status,
            row.status ?? "DRAFT",
            "status",
          ),
          updated_at: new Date(),
        },
        create: {
          id,
          task_no: taskNo,
          title,
          prompt_text: promptText,
          chart_url: asString(row.chart_url),
          image_url: asString(row.image_url),
          level: asNumber(row.level),
          status: parseEnumValue(
            publish_status,
            row.status ?? "DRAFT",
            "status",
          ),
        },
      });

      await tx.writing_task_tags.deleteMany({
        where: { writing_task_id: id },
      });

      if (tagIds.length > 0) {
        await tx.writing_task_tags.createMany({
          data: tagIds.map((tagId) => ({
            writing_task_id: id,
            tag_id: tagId,
          })),
        });
      }

      importedIds.push(id);
    }
  });

  return {
    type: "WRITING_TASK",
    ids: importedIds,
    count: importedIds.length,
  };
}

async function importSpeakingSet(workbook: XLSX.WorkBook) {
  const setRows = getSheetRows(workbook, "speaking_set");
  const partRows = getSheetRows(workbook, "parts");
  const promptRows = getSheetRows(workbook, "prompts");
  const itemRows = getSheetRows(workbook, "items");

  if (setRows.length === 0) {
    throw new Error("speaking_set sheet is empty");
  }

  const row = setRows[0];
  const id = asString(row.id);

  if (!id) {
    throw new Error("speaking_set requires id");
  }

  const tagIds = await resolveTagIdsBySlugs(parseTagSlugs(row.tag_slugs));

  await prisma.$transaction(async (tx) => {
    await tx.speaking_sets.upsert({
      where: { id },
      update: {
        topic: asString(row.topic),
        level: asNumber(row.level),
        status: parseEnumValue(publish_status, row.status ?? "DRAFT", "status"),
        updated_at: new Date(),
      },
      create: {
        id,
        topic: asString(row.topic),
        level: asNumber(row.level),
        status: parseEnumValue(publish_status, row.status ?? "DRAFT", "status"),
      },
    });

    await tx.speaking_set_tags.deleteMany({
      where: { speaking_set_id: id },
    });

    if (tagIds.length > 0) {
      await tx.speaking_set_tags.createMany({
        data: tagIds.map((tagId) => ({
          speaking_set_id: id,
          tag_id: tagId,
        })),
      });
    }

    await tx.speaking_parts.deleteMany({
      where: { speaking_set_id: id },
    });

    const createdParts: Record<string, string> = {};

    for (const part of partRows) {
      const created = await tx.speaking_parts.create({
        data: {
          speaking_set_id: id,
          part_type: parseSpeakingPartTypeForImport(
            part.part_type,
            part.part_no,
          ),
          title: asString(part.title),
          instructions: asString(part.instructions),
          recommended_sec: asNumber(part.recommended_sec),
          sort_order: Number(part.sort_order || 1),
        },
      });

      const partType = created.part_type;
      const partKey = asString(part.part_key);
      const partNo = asString(part.part_no);

      createdParts[String(partKey || partType)] = created.id;
      createdParts[String(partType)] = created.id;

      if (partNo) {
        createdParts[partNo] = created.id;
        createdParts[`PART_${partNo}`] = created.id;
      }
    }

    const createdPrompts: Record<string, string> = {};

    for (const prompt of promptRows) {
      const partKey = String(prompt.part_key || "");
      const speakingPartId = createdParts[partKey];

      if (!speakingPartId) {
        throw new Error(`Prompt references unknown part_key: ${partKey}`);
      }

      const created = await tx.speaking_prompts.create({
        data: {
          speaking_part_id: speakingPartId,
          prompt_type: parseEnumValue(
            speaking_prompt_type,
            prompt.prompt_type,
            "prompt_type",
          ),
          content: String(prompt.content || ""),
          notes: asString(prompt.notes),
          time_suggest_sec: asNumber(prompt.time_suggest_sec),
          sort_order: Number(prompt.sort_order || 1),
        },
      });

      createdPrompts[String(prompt.prompt_key || created.id)] = created.id;
    }

    for (const item of itemRows) {
      const promptKey = String(item.prompt_key || "");
      const speakingPromptId = createdPrompts[promptKey];

      if (!speakingPromptId) {
        throw new Error(`Item references unknown prompt_key: ${promptKey}`);
      }

      await tx.speaking_prompt_items.create({
        data: {
          speaking_prompt_id: speakingPromptId,
          item_text: String(item.item_text || ""),
          sort_order: Number(item.sort_order || 1),
        },
      });
    }
  });

  return {
    type: "SPEAKING_SET",
    id,
    partCount: partRows.length,
    promptCount: promptRows.length,
    itemCount: itemRows.length,
  };
}

async function importTest(workbook: XLSX.WorkBook) {
  const testRows = getSheetRows(workbook, "test");
  const sectionRows = getSheetRows(workbook, "sections");

  if (testRows.length === 0) {
    throw new Error("test sheet is empty");
  }

  const row = testRows[0];
  const id = asString(row.id);
  const title = asString(row.title);

  if (!id || !title) {
    throw new Error("test requires id and title");
  }

  const tagIds = await resolveTagIdsBySlugs(parseTagSlugs(row.tag_slugs));

  await prisma.$transaction(async (tx) => {
    await tx.tests.upsert({
      where: { id },
      update: {
        type: parseEnumValue(test_type, row.type, "type"),
        title,
        level: asNumber(row.level),
        description: asString(row.description),
        status: parseEnumValue(publish_status, row.status ?? "DRAFT", "status"),
        updated_at: new Date(),
      },
      create: {
        id,
        type: parseEnumValue(test_type, row.type, "type"),
        title,
        level: asNumber(row.level),
        description: asString(row.description),
        status: parseEnumValue(publish_status, row.status ?? "DRAFT", "status"),
      },
    });

    await tx.test_tags.deleteMany({
      where: { test_id: id },
    });

    if (tagIds.length > 0) {
      await tx.test_tags.createMany({
        data: tagIds.map((tagId) => ({
          test_id: id,
          tag_id: tagId,
        })),
      });
    }

    await tx.test_sections.deleteMany({
      where: { test_id: id },
    });

    if (sectionRows.length > 0) {
      await tx.test_sections.createMany({
        data: sectionRows.map((section) => ({
          test_id: id,
          section_type: parseEnumValue(
            test_section_type,
            section.section_type,
            "section_type",
          ),
          reading_set_id: asString(section.reading_set_id),
          listening_set_id: asString(section.listening_set_id),
          writing_task_id: asString(section.writing_task_id),
          speaking_set_id: asString(section.speaking_set_id),
          part_label: asString(section.part_label),
          sort_order: Number(section.sort_order || 1),
          time_limit_sec: asNumber(section.time_limit_sec),
        })),
      });
    }
  });

  return {
    type: "TEST",
    id,
    sectionCount: sectionRows.length,
  };
}

export async function processImportJob(importJobId: string) {
  const job = await prisma.import_jobs.findUnique({
    where: { id: importJobId },
  });

  if (!job) {
    throw new Error(`Import job ${importJobId} not found`);
  }

  await prisma.import_jobs.update({
    where: { id: job.id },
    data: {
      status: "PROCESSING",
      started_at: new Date(),
      error_message: null,
    },
  });

  try {
    const response = await fetch(job.file_url);

    if (!response.ok) {
      throw new Error(`Cannot download import file: ${job.file_url}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });

    let result: Record<string, unknown>;

    switch (job.type) {
      case "READING_SET":
        result = await importReadingSet(workbook);
        break;
      case "LISTENING_SET":
        result = await importListeningSet(workbook);
        break;
      case "WRITING_TASK":
        result = await importWritingTask(workbook);
        break;
      case "SPEAKING_SET":
        result = await importSpeakingSet(workbook);
        break;
      case "TEST":
        result = await importTest(workbook);
        break;
      default:
        throw new Error(`Unsupported import type: ${job.type}`);
    }

    await prisma.import_jobs.update({
      where: { id: job.id },
      data: {
        status: "DONE",
        result_json: result as Prisma.InputJsonValue,
        finished_at: new Date(),
      },
    });

    return result;
  } catch (error) {
    await prisma.import_jobs.update({
      where: { id: job.id },
      data: {
        status: "ERROR",
        error_message: (error as Error).message,
        result_json: {
          errors: [(error as Error).message],
        } as Prisma.InputJsonValue,
        finished_at: new Date(),
      },
    });

    throw error;
  }
}
