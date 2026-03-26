function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function mapTag(tag: { id: string; name: string; slug: string }) {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  };
}

function mapSectionSource(section: {
  section_type: string;
  reading_sets?: {
    id: string;
    title: string;
    level: unknown;
    status: string;
  } | null;
  listening_sets?: {
    id: string;
    title: string;
    level: unknown;
    status: string;
  } | null;
  writing_tasks?: {
    id: string;
    task_no: number | null;
    title: string;
    level: unknown;
    status: string;
  } | null;
  speaking_sets?: {
    id: string;
    topic: string | null;
    level: unknown;
    status: string;
  } | null;
}) {
  if (section.section_type === "READING_SET" && section.reading_sets) {
    return {
      type: "READING_SET",
      item: {
        id: section.reading_sets.id,
        title: section.reading_sets.title,
        level: toNullableNumber(section.reading_sets.level),
        status: section.reading_sets.status,
      },
    };
  }

  if (section.section_type === "LISTENING_SET" && section.listening_sets) {
    return {
      type: "LISTENING_SET",
      item: {
        id: section.listening_sets.id,
        title: section.listening_sets.title,
        level: toNullableNumber(section.listening_sets.level),
        status: section.listening_sets.status,
      },
    };
  }

  if (section.section_type === "WRITING_TASK" && section.writing_tasks) {
    return {
      type: "WRITING_TASK",
      item: {
        id: section.writing_tasks.id,
        taskNo: section.writing_tasks.task_no,
        title: section.writing_tasks.title,
        level: toNullableNumber(section.writing_tasks.level),
        status: section.writing_tasks.status,
      },
    };
  }

  if (section.section_type === "SPEAKING_SET" && section.speaking_sets) {
    return {
      type: "SPEAKING_SET",
      item: {
        id: section.speaking_sets.id,
        topic: section.speaking_sets.topic,
        level: toNullableNumber(section.speaking_sets.level),
        status: section.speaking_sets.status,
      },
    };
  }

  return {
    type: section.section_type,
    item: null,
  };
}

function mapSection(section: {
  id: string;
  test_id: string;
  section_type: string;
  reading_set_id: string | null;
  listening_set_id: string | null;
  writing_task_id: string | null;
  speaking_set_id: string | null;
  part_label: string | null;
  sort_order: number;
  time_limit_sec: number | null;
  created_at: Date;
  reading_sets?: {
    id: string;
    title: string;
    level: unknown;
    status: string;
  } | null;
  listening_sets?: {
    id: string;
    title: string;
    level: unknown;
    status: string;
  } | null;
  writing_tasks?: {
    id: string;
    task_no: number | null;
    title: string;
    level: unknown;
    status: string;
  } | null;
  speaking_sets?: {
    id: string;
    topic: string | null;
    level: unknown;
    status: string;
  } | null;
}) {
  return {
    id: section.id,
    testId: section.test_id,
    sectionType: section.section_type,
    readingSetId: section.reading_set_id,
    listeningSetId: section.listening_set_id,
    writingTaskId: section.writing_task_id,
    speakingSetId: section.speaking_set_id,
    partLabel: section.part_label,
    sortOrder: section.sort_order,
    timeLimitSec: section.time_limit_sec,
    createdAt: section.created_at,
    source: mapSectionSource(section),
  };
}

export function mapTestList(test: {
  id: string;
  type: string;
  title: string;
  level: unknown;
  status: string;
  description: string | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  test_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count?: {
    test_sections: number;
    attempts: number;
  };
}) {
  return {
    id: test.id,
    type: test.type,
    title: test.title,
    level: toNullableNumber(test.level),
    status: test.status,
    description: test.description,
    publishedAt: test.published_at,
    createdAt: test.created_at,
    updatedAt: test.updated_at,
    sectionCount: test._count?.test_sections ?? 0,
    attemptCount: test._count?.attempts ?? 0,
    tags: test.test_tags.map((item) => mapTag(item.tags)),
  };
}

export function mapPublicTestDetail(test: {
  id: string;
  type: string;
  title: string;
  level: unknown;
  status: string;
  description: string | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  test_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  test_sections: Array<{
    id: string;
    test_id: string;
    section_type: string;
    reading_set_id: string | null;
    listening_set_id: string | null;
    writing_task_id: string | null;
    speaking_set_id: string | null;
    part_label: string | null;
    sort_order: number;
    time_limit_sec: number | null;
    created_at: Date;
    reading_sets?: {
      id: string;
      title: string;
      level: unknown;
      status: string;
    } | null;
    listening_sets?: {
      id: string;
      title: string;
      level: unknown;
      status: string;
    } | null;
    writing_tasks?: {
      id: string;
      task_no: number | null;
      title: string;
      level: unknown;
      status: string;
    } | null;
    speaking_sets?: {
      id: string;
      topic: string | null;
      level: unknown;
      status: string;
    } | null;
  }>;
}) {
  return {
    id: test.id,
    type: test.type,
    title: test.title,
    level: toNullableNumber(test.level),
    status: test.status,
    description: test.description,
    publishedAt: test.published_at,
    createdAt: test.created_at,
    updatedAt: test.updated_at,
    tags: test.test_tags.map((item) => mapTag(item.tags)),
    sections: test.test_sections.map(mapSection),
  };
}

export function mapAdminTestDetail(test: {
  id: string;
  type: string;
  title: string;
  level: unknown;
  status: string;
  description: string | null;
  published_at: Date | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  test_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  test_sections: Array<{
    id: string;
    test_id: string;
    section_type: string;
    reading_set_id: string | null;
    listening_set_id: string | null;
    writing_task_id: string | null;
    speaking_set_id: string | null;
    part_label: string | null;
    sort_order: number;
    time_limit_sec: number | null;
    created_at: Date;
    reading_sets?: {
      id: string;
      title: string;
      level: unknown;
      status: string;
    } | null;
    listening_sets?: {
      id: string;
      title: string;
      level: unknown;
      status: string;
    } | null;
    writing_tasks?: {
      id: string;
      task_no: number | null;
      title: string;
      level: unknown;
      status: string;
    } | null;
    speaking_sets?: {
      id: string;
      topic: string | null;
      level: unknown;
      status: string;
    } | null;
  }>;
  _count?: {
    attempts: number;
  };
}) {
  return {
    id: test.id,
    type: test.type,
    title: test.title,
    level: toNullableNumber(test.level),
    status: test.status,
    description: test.description,
    publishedAt: test.published_at,
    createdBy: test.created_by,
    createdAt: test.created_at,
    updatedAt: test.updated_at,
    attemptCount: test._count?.attempts ?? 0,
    tags: test.test_tags.map((item) => mapTag(item.tags)),
    sections: test.test_sections.map(mapSection),
  };
}

export function mapSectionDetail(section: {
  id: string;
  test_id: string;
  section_type: string;
  reading_set_id: string | null;
  listening_set_id: string | null;
  writing_task_id: string | null;
  speaking_set_id: string | null;
  part_label: string | null;
  sort_order: number;
  time_limit_sec: number | null;
  created_at: Date;
  reading_sets?: {
    id: string;
    title: string;
    level: unknown;
    status: string;
  } | null;
  listening_sets?: {
    id: string;
    title: string;
    level: unknown;
    status: string;
  } | null;
  writing_tasks?: {
    id: string;
    task_no: number | null;
    title: string;
    level: unknown;
    status: string;
  } | null;
  speaking_sets?: {
    id: string;
    topic: string | null;
    level: unknown;
    status: string;
  } | null;
}) {
  return mapSection(section);
}
