function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

type LinkedTestSection = {
  id: string;
  test_id: string;
  part_label: string | null;
  sort_order: number;
  time_limit_sec: number | null;
  tests: {
    id: string;
    type: string;
    title: string;
    level: unknown;
    status: string;
    description: string | null;
    published_at: Date | null;
  };
};

function mapAvailableTests(sections: LinkedTestSection[]) {
  return sections
    .filter((section) => section.tests.status === "PUBLISHED")
    .map((section) => ({
      testId: section.tests.id,
      testTitle: section.tests.title,
      testType: section.tests.type,
      testLevel: toNullableNumber(section.tests.level),
      testDescription: section.tests.description,
      publishedAt: section.tests.published_at,
      sectionId: section.id,
      partLabel: section.part_label,
      sortOrder: section.sort_order,
      timeLimitSec: section.time_limit_sec,
    }));
}

export function mapSpeakingSetList(set: {
  id: string;
  topic: string | null;
  level: unknown;
  status: string;
  created_at: Date;
  updated_at: Date;
  speaking_set_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count?: {
    speaking_parts: number;
  };
}) {
  return {
    id: set.id,
    topic: set.topic,
    level: toNullableNumber(set.level),
    status: set.status,
    createdAt: set.created_at,
    updatedAt: set.updated_at,
    partCount: set._count?.speaking_parts ?? 0,
    tags: set.speaking_set_tags.map((item) => ({
      id: item.tags.id,
      name: item.tags.name,
      slug: item.tags.slug,
    })),
  };
}

export function mapPublicSpeakingSetDetail(set: {
  id: string;
  topic: string | null;
  level: unknown;
  status: string;
  created_at: Date;
  updated_at: Date;
  speaking_set_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count: {
    speaking_parts: number;
  };
  test_sections: LinkedTestSection[];
}) {
  return {
    id: set.id,
    topic: set.topic,
    level: toNullableNumber(set.level),
    status: set.status,
    createdAt: set.created_at,
    updatedAt: set.updated_at,
    partCount: set._count.speaking_parts,
    tags: set.speaking_set_tags.map((item) => ({
      id: item.tags.id,
      name: item.tags.name,
      slug: item.tags.slug,
    })),
    availableTests: mapAvailableTests(set.test_sections),
  };
}

export function mapSpeakingSetDetail(set: {
  id: string;
  topic: string | null;
  level: unknown;
  status: string;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  speaking_set_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  speaking_parts: Array<{
    id: string;
    speaking_set_id: string;
    part_type: string;
    title: string | null;
    instructions: string | null;
    recommended_sec: number | null;
    sort_order: number;
    created_at: Date;
    updated_at: Date;
    speaking_prompts: Array<{
      id: string;
      speaking_part_id: string;
      prompt_type: string;
      content: string;
      notes: string | null;
      time_suggest_sec: number | null;
      sort_order: number;
      created_at: Date;
      updated_at: Date;
      speaking_prompt_items: Array<{
        id: string;
        speaking_prompt_id: string;
        item_text: string;
        sort_order: number;
        created_at: Date;
      }>;
    }>;
  }>;
}) {
  return {
    id: set.id,
    topic: set.topic,
    level: toNullableNumber(set.level),
    status: set.status,
    createdBy: set.created_by,
    createdAt: set.created_at,
    updatedAt: set.updated_at,
    tags: set.speaking_set_tags.map((item) => ({
      id: item.tags.id,
      name: item.tags.name,
      slug: item.tags.slug,
    })),
    parts: set.speaking_parts.map((part) => ({
      id: part.id,
      speakingSetId: part.speaking_set_id,
      partType: part.part_type,
      title: part.title,
      instructions: part.instructions,
      recommendedSec: part.recommended_sec,
      sortOrder: part.sort_order,
      createdAt: part.created_at,
      updatedAt: part.updated_at,
      prompts: part.speaking_prompts.map((prompt) => ({
        id: prompt.id,
        speakingPartId: prompt.speaking_part_id,
        promptType: prompt.prompt_type,
        content: prompt.content,
        notes: prompt.notes,
        timeSuggestSec: prompt.time_suggest_sec,
        sortOrder: prompt.sort_order,
        createdAt: prompt.created_at,
        updatedAt: prompt.updated_at,
        items: prompt.speaking_prompt_items.map((item) => ({
          id: item.id,
          speakingPromptId: item.speaking_prompt_id,
          itemText: item.item_text,
          sortOrder: item.sort_order,
          createdAt: item.created_at,
        })),
      })),
    })),
  };
}
