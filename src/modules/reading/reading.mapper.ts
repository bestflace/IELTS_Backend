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

function mapPublicQuestion(question: {
  id: string;
  reading_set_id: string | null;
  section_label: string | null;
  q_no: number;
  question_type: string;
  prompt_text: string;
  instruction_text: string | null;
  options_json: unknown;
  points: unknown;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: question.id,
    readingSetId: question.reading_set_id,
    sectionLabel: question.section_label,
    qNo: question.q_no,
    questionType: question.question_type,
    promptText: question.prompt_text,
    instructionText: question.instruction_text,
    optionsJson: question.options_json,
    points: Number(question.points),
    sortOrder: question.sort_order,
    createdAt: question.created_at,
    updatedAt: question.updated_at,
  };
}

function mapAdminQuestion(question: {
  id: string;
  reading_set_id: string | null;
  section_label: string | null;
  q_no: number;
  question_type: string;
  prompt_text: string;
  instruction_text: string | null;
  options_json: unknown;
  correct_answer_json: unknown;
  explanation: string | null;
  points: unknown;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    ...mapPublicQuestion(question),
    correctAnswerJson: question.correct_answer_json,
    explanation: question.explanation,
  };
}

export function mapReadingSetList(set: {
  id: string;
  title: string;
  level: unknown;
  status: string;
  created_at: Date;
  updated_at: Date;
  reading_set_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count?: {
    questions: number;
  };
}) {
  return {
    id: set.id,
    title: set.title,
    level: toNullableNumber(set.level),
    status: set.status,
    createdAt: set.created_at,
    updatedAt: set.updated_at,
    questionCount: set._count?.questions ?? 0,
    tags: set.reading_set_tags.map((item) => mapTag(item.tags)),
  };
}

export function mapPublicReadingSetDetail(set: {
  id: string;
  title: string;
  level: unknown;
  status: string;
  created_at: Date;
  updated_at: Date;
  reading_set_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count: {
    questions: number;
  };
  test_sections: LinkedTestSection[];
}) {
  return {
    id: set.id,
    title: set.title,
    level: toNullableNumber(set.level),
    status: set.status,
    createdAt: set.created_at,
    updatedAt: set.updated_at,
    questionCount: set._count.questions,
    tags: set.reading_set_tags.map((item) => mapTag(item.tags)),
    availableTests: mapAvailableTests(set.test_sections),
  };
}

export function mapAdminReadingSetDetail(set: {
  id: string;
  title: string;
  passage_html: string | null;
  passage_text: string | null;
  level: unknown;
  status: string;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  reading_set_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  questions: Array<{
    id: string;
    reading_set_id: string | null;
    section_label: string | null;
    q_no: number;
    question_type: string;
    prompt_text: string;
    instruction_text: string | null;
    options_json: unknown;
    correct_answer_json: unknown;
    explanation: string | null;
    points: unknown;
    sort_order: number;
    created_at: Date;
    updated_at: Date;
  }>;
}) {
  return {
    id: set.id,
    title: set.title,
    passageHtml: set.passage_html,
    passageText: set.passage_text,
    level: toNullableNumber(set.level),
    status: set.status,
    createdBy: set.created_by,
    createdAt: set.created_at,
    updatedAt: set.updated_at,
    tags: set.reading_set_tags.map((item) => mapTag(item.tags)),
    questions: set.questions.map(mapAdminQuestion),
  };
}

export function mapAdminReadingQuestion(question: {
  id: string;
  reading_set_id: string | null;
  section_label: string | null;
  q_no: number;
  question_type: string;
  prompt_text: string;
  instruction_text: string | null;
  options_json: unknown;
  correct_answer_json: unknown;
  explanation: string | null;
  points: unknown;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}) {
  return mapAdminQuestion(question);
}
