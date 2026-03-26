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

function mapPublicQuestion(question: {
  id: string;
  listening_set_id: string | null;
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
    listeningSetId: question.listening_set_id,
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
  listening_set_id: string | null;
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

export function mapListeningSetList(set: {
  id: string;
  title: string;
  level: unknown;
  status: string;
  audio_url: string | null;
  audio_source: string | null;
  created_at: Date;
  updated_at: Date;
  listening_set_tags: Array<{
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
    audioUrl: set.audio_url,
    audioSource: set.audio_source,
    createdAt: set.created_at,
    updatedAt: set.updated_at,
    questionCount: set._count?.questions ?? 0,
    tags: set.listening_set_tags.map((item) => mapTag(item.tags)),
  };
}

export function mapPublicListeningSetDetail(set: {
  id: string;
  title: string;
  audio_url: string | null;
  audio_source: string | null;
  level: unknown;
  status: string;
  created_at: Date;
  updated_at: Date;
  listening_set_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  questions: Array<{
    id: string;
    listening_set_id: string | null;
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
  }>;
}) {
  return {
    id: set.id,
    title: set.title,
    audioUrl: set.audio_url,
    audioSource: set.audio_source,
    level: toNullableNumber(set.level),
    status: set.status,
    createdAt: set.created_at,
    updatedAt: set.updated_at,
    tags: set.listening_set_tags.map((item) => mapTag(item.tags)),
    questions: set.questions.map(mapPublicQuestion),
  };
}

export function mapAdminListeningSetDetail(set: {
  id: string;
  title: string;
  transcript_text: string | null;
  audio_url: string | null;
  audio_source: string | null;
  level: unknown;
  status: string;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  listening_set_tags: Array<{
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  questions: Array<{
    id: string;
    listening_set_id: string | null;
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
    transcriptText: set.transcript_text,
    audioUrl: set.audio_url,
    audioSource: set.audio_source,
    level: toNullableNumber(set.level),
    status: set.status,
    createdBy: set.created_by,
    createdAt: set.created_at,
    updatedAt: set.updated_at,
    tags: set.listening_set_tags.map((item) => mapTag(item.tags)),
    questions: set.questions.map(mapAdminQuestion),
  };
}

export function mapAdminListeningQuestion(question: {
  id: string;
  listening_set_id: string | null;
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
