export function mapAttemptListItem(attempt: any) {
  return {
    id: attempt.id,
    userId: attempt.user_id,
    testId: attempt.test_id,
    mode: attempt.mode,
    partLabel: attempt.part_label,
    timeLimitSec: attempt.time_limit_sec,
    startedAt: attempt.started_at,
    expiresAt: attempt.expires_at,
    submittedAt: attempt.submitted_at,
    gradedAt: attempt.graded_at,
    status: attempt.status,
    createdAt: attempt.created_at,
    updatedAt: attempt.updated_at,
    result: attempt.attempt_results
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
    teacherSubmissions:
      attempt.teacher_submissions?.map((item: any) => ({
        id: item.id,
        skill: item.skill,
        status: item.status,
        claimedBy: item.claimed_by,
        claimedAt: item.claimed_at,
        reviewedAt: item.reviewed_at,
      })) ?? [],
  };
}

export function mapQuestionAnswer(answer: any) {
  return {
    id: answer.id,
    attemptId: answer.attempt_id,
    questionId: answer.question_id,
    qNo: answer.q_no,
    answerJson: answer.answer_json,
    isFlagged: answer.is_flagged,
    isFinal: answer.is_final,
    savedAt: answer.saved_at,
  };
}

export function mapWritingResponse(response: any) {
  return {
    id: response.id,
    attemptId: response.attempt_id,
    writingTaskId: response.writing_task_id,
    responseText: response.response_text,
    wordCount: response.word_count,
    savedAt: response.saved_at,
    updatedAt: response.updated_at,
  };
}

export function mapSpeakingResponse(response: any) {
  return {
    id: response.id,
    attemptId: response.attempt_id,
    speakingPart: response.speaking_part,
    promptId: response.prompt_id,
    audioUrl: response.audio_url,
    transcript: response.transcript,
    durationSec: response.duration_sec,
    createdAt: response.created_at,
  };
}

export function mapAttemptResultDetail(detail: any) {
  return {
    id: detail.id,
    attemptId: detail.attempt_id,
    questionId: detail.question_id,
    qNo: detail.q_no,
    userAnswerJson: detail.user_answer_json,
    correctJson: detail.correct_json,
    isCorrect: detail.is_correct,
    pointsAwarded: detail.points_awarded ? Number(detail.points_awarded) : null,
    explanation: detail.explanation,
    createdAt: detail.created_at,
  };
}

export function mapTeacherReview(review: any) {
  return {
    id: review.id,
    submissionId: review.submission_id,
    attemptId: review.attempt_id,
    teacherId: review.teacher_id,
    overallBand: review.overall_band ? Number(review.overall_band) : null,
    criteriaJson: review.criteria_json,
    summary: review.summary,
    actionItemsJson: review.action_items_json,
    createdAt: review.created_at,
    updatedAt: review.updated_at,
  };
}
