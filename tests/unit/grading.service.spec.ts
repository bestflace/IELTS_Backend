import { gradeObjectiveQuestions } from "../../src/modules/attempts/grading.service";

describe("gradeObjectiveQuestions", () => {
  it("grades exact match answers correctly", () => {
    const result = gradeObjectiveQuestions({
      skill: "READING",
      questions: [
        {
          id: "q1",
          qNo: 1,
          correctAnswerJson: { value: "A" },
          explanation: "Correct",
          points: 1,
        },
        {
          id: "q2",
          qNo: 2,
          correctAnswerJson: { value: "environment" },
          explanation: "Correct",
          points: 1,
        },
      ],
      answers: [
        {
          question_id: "q1",
          q_no: 1,
          answer_json: { value: "A" },
        },
        {
          question_id: "q2",
          q_no: 2,
          answer_json: { value: "environment" },
        },
      ],
    });

    expect(result.correctCount).toBe(2);
    expect(result.totalCount).toBe(2);
    expect(result.rawScore).toBe(2);
    expect(result.details[0].isCorrect).toBe(true);
    expect(result.details[1].isCorrect).toBe(true);
  });

  it("treats missing answers as incorrect", () => {
    const result = gradeObjectiveQuestions({
      skill: "LISTENING",
      questions: [
        {
          id: "q1",
          qNo: 1,
          correctAnswerJson: { value: "A" },
          explanation: null,
          points: 1,
        },
      ],
      answers: [],
    });

    expect(result.correctCount).toBe(0);
    expect(result.rawScore).toBe(0);
    expect(result.details[0].isCorrect).toBe(false);
  });
});
