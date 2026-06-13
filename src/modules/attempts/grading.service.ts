type SnapshotQuestion = {
  id: string;
  qNo: number;
  correctAnswerJson: unknown;
  explanation?: string | null;
  points?: number;
};

type AnswerRecord = {
  question_id: string | null;
  q_no: number | null;
  answer_json: unknown;
};

function normalizePrimitive(value: unknown): string {
  if (typeof value === "string") {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim().toLowerCase();
  }

  if (value === null || value === undefined) {
    return "";
  }

  return JSON.stringify(value);
}

function extractComparableValues(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap(extractComparableValues)
      .map(normalizePrimitive)
      .filter(Boolean);
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    // Supported answer shapes. Keep these aliases because answers can come
    // from manual admin entry, Excel import, or learner UI components.
    if ("value" in obj) {
      return extractComparableValues(obj.value);
    }

    if ("values" in obj) {
      return extractComparableValues(obj.values);
    }

    if ("answer" in obj) {
      return extractComparableValues(obj.answer);
    }

    if ("answers" in obj) {
      return extractComparableValues(obj.answers);
    }

    if ("selected" in obj) {
      return extractComparableValues(obj.selected);
    }

    if ("selectedOptions" in obj) {
      return extractComparableValues(obj.selectedOptions);
    }

    return [normalizePrimitive(obj)];
  }

  return [normalizePrimitive(value)];
}

function compareAnswer(
  userAnswerJson: unknown,
  correctAnswerJson: unknown,
): boolean {
  const userValues = extractComparableValues(userAnswerJson).sort();
  const correctValues = extractComparableValues(correctAnswerJson).sort();

  if (userValues.length === 0 || correctValues.length === 0) {
    return false;
  }

  if (userValues.length !== correctValues.length) {
    return false;
  }

  return userValues.every((value, index) => value === correctValues[index]);
}

function estimateReadingBand(score40: number): number {
  if (score40 >= 39) return 9;
  if (score40 >= 37) return 8.5;
  if (score40 >= 35) return 8;
  if (score40 >= 33) return 7.5;
  if (score40 >= 30) return 7;
  if (score40 >= 27) return 6.5;
  if (score40 >= 23) return 6;
  if (score40 >= 19) return 5.5;
  if (score40 >= 15) return 5;
  if (score40 >= 13) return 4.5;
  if (score40 >= 10) return 4;
  if (score40 >= 8) return 3.5;
  if (score40 >= 6) return 3;
  if (score40 >= 4) return 2.5;
  return 0;
}

function estimateListeningBand(score40: number): number {
  if (score40 >= 39) return 9;
  if (score40 >= 37) return 8.5;
  if (score40 >= 35) return 8;
  if (score40 >= 32) return 7.5;
  if (score40 >= 30) return 7;
  if (score40 >= 26) return 6.5;
  if (score40 >= 23) return 6;
  if (score40 >= 18) return 5.5;
  if (score40 >= 16) return 5;
  if (score40 >= 13) return 4.5;
  if (score40 >= 10) return 4;
  if (score40 >= 8) return 3.5;
  if (score40 >= 6) return 3;
  if (score40 >= 4) return 2.5;
  return 0;
}

export function gradeObjectiveQuestions(params: {
  questions: SnapshotQuestion[];
  answers: AnswerRecord[];
  skill: "READING" | "LISTENING";
}) {
  const answerMap = new Map<string, AnswerRecord>();

  for (const answer of params.answers) {
    if (answer.question_id) {
      answerMap.set(answer.question_id, answer);
    }
  }

  let correctCount = 0;
  let totalPoints = 0;
  let awardedPoints = 0;

  const details = params.questions.map((question) => {
    const answer = answerMap.get(question.id);
    const isCorrect = compareAnswer(
      answer?.answer_json,
      question.correctAnswerJson,
    );
    const points = Number(question.points ?? 1);
    const pointsAwarded = isCorrect ? points : 0;

    totalPoints += points;
    awardedPoints += pointsAwarded;

    if (isCorrect) {
      correctCount += 1;
    }

    return {
      questionId: question.id,
      qNo: question.qNo,
      userAnswerJson: answer?.answer_json ?? null,
      correctJson: question.correctAnswerJson,
      isCorrect,
      pointsAwarded,
      explanation: question.explanation ?? null,
    };
  });

  const scaled40 =
    totalPoints > 0 ? Math.round((awardedPoints / totalPoints) * 40) : 0;
  const bandEstimate =
    params.skill === "READING"
      ? estimateReadingBand(scaled40)
      : estimateListeningBand(scaled40);

  return {
    correctCount,
    totalCount: params.questions.length,
    rawScore: awardedPoints,
    scaled40,
    bandEstimate,
    details,
  };
}
