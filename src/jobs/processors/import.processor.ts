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

function parseTagSlugs(value: unknown) {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
        passage_html: asString(row.passage_html),
        passage_text: asString(row.passage_text),
        level: asNumber(row.level),
        status: parseEnumValue(publish_status, row.status ?? "DRAFT", "status"),
        updated_at: new Date(),
      },
      create: {
        id,
        title,
        passage_html: asString(row.passage_html),
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
      await tx.questions.createMany({
        data: questionRows.map((item) => ({
          reading_set_id: id,
          section_label: asString(item.section_label),
          q_no: Number(item.q_no),
          question_type: parseEnumValue(
            question_type,
            item.question_type,
            "question_type",
          ),
          prompt_text: String(item.prompt_text || ""),
          instruction_text: asString(item.instruction_text),
          options_json: toNullableJsonField(asJson(item.options_json)),
          correct_answer_json: toRequiredJsonField(
            asJson(item.correct_answer_json),
            {},
          ),
          explanation: asString(item.explanation),
          points: asNumber(item.points) ?? 1,
          sort_order: Number(item.sort_order || item.q_no || 1),
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
      await tx.questions.createMany({
        data: questionRows.map((item) => ({
          listening_set_id: id,
          section_label: asString(item.section_label),
          q_no: Number(item.q_no),
          question_type: parseEnumValue(
            question_type,
            item.question_type,
            "question_type",
          ),
          prompt_text: String(item.prompt_text || ""),
          instruction_text: asString(item.instruction_text),
          options_json: toNullableJsonField(asJson(item.options_json)),
          correct_answer_json: toRequiredJsonField(
            asJson(item.correct_answer_json),
            {},
          ),
          explanation: asString(item.explanation),
          points: asNumber(item.points) ?? 1,
          sort_order: Number(item.sort_order || item.q_no || 1),
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

  const row = rows[0];
  const id = asString(row.id);
  const title = asString(row.title);
  const promptText = asString(row.prompt_text);

  if (!id || !title || !promptText) {
    throw new Error("writing_task requires id, title, prompt_text");
  }

  const tagIds = await resolveTagIdsBySlugs(parseTagSlugs(row.tag_slugs));

  await prisma.$transaction(async (tx) => {
    await tx.writing_tasks.upsert({
      where: { id },
      update: {
        task_no: asNumber(row.task_no),
        title,
        prompt_text: promptText,
        chart_url: asString(row.chart_url),
        image_url: asString(row.image_url),
        level: asNumber(row.level),
        status: parseEnumValue(publish_status, row.status ?? "DRAFT", "status"),
        updated_at: new Date(),
      },
      create: {
        id,
        task_no: asNumber(row.task_no),
        title,
        prompt_text: promptText,
        chart_url: asString(row.chart_url),
        image_url: asString(row.image_url),
        level: asNumber(row.level),
        status: parseEnumValue(publish_status, row.status ?? "DRAFT", "status"),
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
  });

  return {
    type: "WRITING_TASK",
    id,
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
          part_type: parseEnumValue(
            speaking_part_type,
            part.part_type,
            "part_type",
          ),
          title: asString(part.title),
          instructions: asString(part.instructions),
          recommended_sec: asNumber(part.recommended_sec),
          sort_order: Number(part.sort_order || 1),
        },
      });

      createdParts[String(part.part_key || created.part_type)] = created.id;
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
