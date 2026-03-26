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

export function mapWritingTaskList(task: {
  id: string;
  task_no: number | null;
  title: string;
  level: unknown;
  status: string;
  chart_url: string | null;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
  writing_task_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count?: {
    attempt_writing_responses: number;
    test_sections: number;
  };
}) {
  return {
    id: task.id,
    taskNo: task.task_no,
    title: task.title,
    level: toNullableNumber(task.level),
    status: task.status,
    chartUrl: task.chart_url,
    imageUrl: task.image_url,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    attemptCount: task._count?.attempt_writing_responses ?? 0,
    testSectionCount: task._count?.test_sections ?? 0,
    tags: task.writing_task_tags.map((item) => mapTag(item.tags)),
  };
}

export function mapPublicWritingTaskDetail(task: {
  id: string;
  task_no: number | null;
  title: string;
  prompt_text: string;
  chart_url: string | null;
  image_url: string | null;
  level: unknown;
  status: string;
  created_at: Date;
  updated_at: Date;
  writing_task_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}) {
  return {
    id: task.id,
    taskNo: task.task_no,
    title: task.title,
    promptText: task.prompt_text,
    chartUrl: task.chart_url,
    imageUrl: task.image_url,
    level: toNullableNumber(task.level),
    status: task.status,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    tags: task.writing_task_tags.map((item) => mapTag(item.tags)),
  };
}

export function mapAdminWritingTaskDetail(task: {
  id: string;
  task_no: number | null;
  title: string;
  prompt_text: string;
  chart_url: string | null;
  image_url: string | null;
  level: unknown;
  status: string;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  writing_task_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count?: {
    attempt_writing_responses: number;
    test_sections: number;
  };
}) {
  return {
    id: task.id,
    taskNo: task.task_no,
    title: task.title,
    promptText: task.prompt_text,
    chartUrl: task.chart_url,
    imageUrl: task.image_url,
    level: toNullableNumber(task.level),
    status: task.status,
    createdBy: task.created_by,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    attemptCount: task._count?.attempt_writing_responses ?? 0,
    testSectionCount: task._count?.test_sections ?? 0,
    tags: task.writing_task_tags.map((item) => mapTag(item.tags)),
  };
}
