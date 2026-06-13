import { teacher_submission_status, test_type } from "@prisma/client";
import { enqueueSubmissionReviewedNotification } from "../../jobs/queues";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import { ConflictError } from "../../common/errors/conflict.error";
import { ForbiddenError } from "../../common/errors/forbidden.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../common/utils/pagination";
import {
  SpeakingReviewBody,
  TeacherSubmissionListQuery,
  WritingReviewBody,
} from "./teacher-review.types";
import { teacherReviewRepository } from "./teacher-review.repository";

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function mapTeacherSubmissionListItem(item: any) {
  return {
    id: item.id,
    attemptId: item.attempt_id,
    skill: item.skill,
    status: item.status,
    claimedBy: item.claimed_by,
    claimedAt: item.claimed_at,
    reviewedAt: item.reviewed_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    claimedTeacher: item.users
      ? {
          id: item.users.id,
          fullName: item.users.full_name,
          email: item.users.email,
          avatarUrl: item.users.avatar_url,
        }
      : null,
    learner: item.attempts?.users
      ? {
          id: item.attempts.users.id,
          fullName: item.attempts.users.full_name,
          email: item.attempts.users.email,
          avatarUrl: item.attempts.users.avatar_url,
        }
      : null,
    test: item.attempts?.tests
      ? {
          id: item.attempts.tests.id,
          title: item.attempts.tests.title,
          type: item.attempts.tests.type,
          level: toNullableNumber(item.attempts.tests.level),
        }
      : null,
    attemptStatus: item.attempts?.status ?? null,
    attemptResult: item.attempts?.attempt_results
      ? {
          correctCount: item.attempts.attempt_results.correct_count,
          totalCount: item.attempts.attempt_results.total_count,
          rawScore: item.attempts.attempt_results.raw_score
            ? Number(item.attempts.attempt_results.raw_score)
            : null,
          bandEstimate: item.attempts.attempt_results.band_estimate
            ? Number(item.attempts.attempt_results.band_estimate)
            : null,
          summaryJson: item.attempts.attempt_results.summary_json,
        }
      : null,
    review: item.teacher_reviews
      ? {
          id: item.teacher_reviews.id,
          overallBand:
            item.teacher_reviews.overall_band === null ||
            item.teacher_reviews.overall_band === undefined
              ? null
              : Number(item.teacher_reviews.overall_band),
          criteriaJson: item.teacher_reviews.criteria_json,
          summary: item.teacher_reviews.summary,
          actionItemsJson: item.teacher_reviews.action_items_json,
          reviewedBy: item.teacher_reviews.users
            ? {
                id: item.teacher_reviews.users.id,
                fullName: item.teacher_reviews.users.full_name,
                email: item.teacher_reviews.users.email,
                avatarUrl: item.teacher_reviews.users.avatar_url,
              }
            : null,
          createdAt: item.teacher_reviews.created_at,
          updatedAt: item.teacher_reviews.updated_at,
        }
      : null,
  };
}

function mapTeacherSubmissionDetail(item: any) {
  return {
    ...mapTeacherSubmissionListItem(item),
    snapshot: item.attempts?.attempt_snapshots?.test_snapshot_json ?? null,
    questionAnswers:
      item.attempts?.attempt_question_answers?.map((answer: any) => ({
        id: answer.id,
        questionId: answer.question_id,
        qNo: answer.q_no,
        answerJson: answer.answer_json,
        isFlagged: answer.is_flagged,
        isFinal: answer.is_final,
        savedAt: answer.saved_at,
      })) ?? [],
    writingResponses:
      item.attempts?.attempt_writing_responses?.map((response: any) => ({
        id: response.id,
        writingTaskId: response.writing_task_id,
        responseText: response.response_text,
        wordCount: response.word_count,
        savedAt: response.saved_at,
        updatedAt: response.updated_at,
      })) ?? [],
    speakingResponses:
      item.attempts?.attempt_speaking_responses?.map((response: any) => ({
        id: response.id,
        speakingPart: response.speaking_part,
        promptId: response.prompt_id,
        audioUrl: response.audio_url,
        transcript: response.transcript,
        durationSec: response.duration_sec,
        createdAt: response.created_at,
      })) ?? [],
    resultDetails:
      item.attempts?.attempt_result_details?.map((detail: any) => ({
        id: detail.id,
        questionId: detail.question_id,
        qNo: detail.q_no,
        userAnswerJson: detail.user_answer_json,
        correctJson: detail.correct_json,
        isCorrect: detail.is_correct,
        pointsAwarded: detail.points_awarded
          ? Number(detail.points_awarded)
          : null,
        explanation: detail.explanation,
        createdAt: detail.created_at,
      })) ?? [],
    aiGradings:
      item.attempts?.ai_gradings?.map((grading: any) => ({
        id: grading.id,
        skill: grading.skill,
        status: grading.status,
        provider: grading.provider,
        startedAt: grading.started_at,
        finishedAt: grading.finished_at,
        errorMessage: grading.error_message,
      })) ?? [],
    asrJobs:
      item.attempts?.asr_jobs?.map((job: any) => ({
        id: job.id,
        status: job.status,
        provider: job.provider,
        startedAt: job.started_at,
        finishedAt: job.finished_at,
        errorMessage: job.error_message,
      })) ?? [],
    allTeacherSubmissions:
      item.attempts?.teacher_submissions?.map((submission: any) => ({
        id: submission.id,
        skill: submission.skill,
        status: submission.status,
        claimedBy: submission.claimed_by,
        claimedAt: submission.claimed_at,
        reviewedAt: submission.reviewed_at,
        review: submission.teacher_reviews
          ? {
              id: submission.teacher_reviews.id,
              overallBand:
                submission.teacher_reviews.overall_band === null ||
                submission.teacher_reviews.overall_band === undefined
                  ? null
                  : Number(submission.teacher_reviews.overall_band),
              criteriaJson: submission.teacher_reviews.criteria_json,
              summary: submission.teacher_reviews.summary,
              actionItemsJson: submission.teacher_reviews.action_items_json,
              reviewedBy: submission.teacher_reviews.users
                ? {
                    id: submission.teacher_reviews.users.id,
                    fullName: submission.teacher_reviews.users.full_name,
                    email: submission.teacher_reviews.users.email,
                    avatarUrl: submission.teacher_reviews.users.avatar_url,
                  }
                : null,
            }
          : null,
      })) ?? [],
  };
}

async function finalizeReviewFlow(submission: any) {
  const remaining = await teacherReviewRepository.countRemainingPendingReviews(
    submission.attempt_id,
  );

  await teacherReviewRepository.updateAttemptGraded(
    submission.attempt_id,
    remaining === 0,
  );

  await enqueueSubmissionReviewedNotification(submission.attempt_id);
}

export const teacherReviewService = {
  async getTeacherSubmissions(
    teacherId: string,
    query: TeacherSubmissionListQuery,
  ) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      teacherReviewRepository.findTeacherSubmissions({
        teacherId,
        skip: pagination.skip,
        take: pagination.limit,
        skill: query.skill as test_type | undefined,
        status: query.status as teacher_submission_status | undefined,
        mine: query.mine,
      }),
      teacherReviewRepository.countTeacherSubmissions({
        teacherId,
        skill: query.skill as test_type | undefined,
        status: query.status as teacher_submission_status | undefined,
        mine: query.mine,
      }),
    ]);

    return {
      items: items.map(mapTeacherSubmissionListItem),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },

  async getTeacherSubmissionDetail(submissionId: string) {
    const submission =
      await teacherReviewRepository.findTeacherSubmissionById(submissionId);

    if (!submission) {
      throw new NotFoundError(MESSAGE.TEACHER_REVIEW.SUBMISSION_NOT_FOUND);
    }

    return mapTeacherSubmissionDetail(submission);
  },

  async claimSubmission(teacherId: string, submissionId: string) {
    const submission =
      await teacherReviewRepository.findTeacherSubmissionById(submissionId);

    if (!submission) {
      throw new NotFoundError(MESSAGE.TEACHER_REVIEW.SUBMISSION_NOT_FOUND);
    }

    if (submission.status === teacher_submission_status.REVIEWED) {
      throw new ConflictError(
        MESSAGE.TEACHER_REVIEW.SUBMISSION_ALREADY_REVIEWED,
      );
    }

    if (
      submission.status === teacher_submission_status.CLAIMED &&
      submission.claimed_by &&
      submission.claimed_by !== teacherId
    ) {
      throw new ConflictError(
        MESSAGE.TEACHER_REVIEW.SUBMISSION_ALREADY_CLAIMED,
      );
    }

    if (
      submission.status === teacher_submission_status.CLAIMED &&
      submission.claimed_by === teacherId
    ) {
      return mapTeacherSubmissionDetail(submission);
    }

    const claimed = await teacherReviewRepository.claimSubmission(
      submissionId,
      teacherId,
    );

    return mapTeacherSubmissionDetail(claimed);
  },

  async releaseSubmission(teacherId: string, submissionId: string) {
    const submission =
      await teacherReviewRepository.findTeacherSubmissionById(submissionId);

    if (!submission) {
      throw new NotFoundError(MESSAGE.TEACHER_REVIEW.SUBMISSION_NOT_FOUND);
    }

    if (submission.status === teacher_submission_status.REVIEWED) {
      throw new ConflictError(
        MESSAGE.TEACHER_REVIEW.SUBMISSION_ALREADY_REVIEWED,
      );
    }

    if (submission.claimed_by !== teacherId) {
      throw new ForbiddenError(
        MESSAGE.TEACHER_REVIEW.SUBMISSION_NOT_CLAIMED_BY_YOU,
      );
    }

    const released =
      await teacherReviewRepository.releaseSubmission(submissionId);

    return mapTeacherSubmissionDetail(released);
  },

  async submitWritingReview(
    teacherId: string,
    submissionId: string,
    body: WritingReviewBody,
  ) {
    const submission =
      await teacherReviewRepository.findTeacherSubmissionById(submissionId);

    if (!submission) {
      throw new NotFoundError(MESSAGE.TEACHER_REVIEW.SUBMISSION_NOT_FOUND);
    }

    if (submission.skill !== test_type.WRITING) {
      throw new BadRequestError(
        MESSAGE.TEACHER_REVIEW.INVALID_SUBMISSION_SKILL,
      );
    }

    const isReviewed = submission.status === teacher_submission_status.REVIEWED;

    if (!isReviewed && submission.claimed_by !== teacherId) {
      throw new ForbiddenError(
        MESSAGE.TEACHER_REVIEW.SUBMISSION_NOT_CLAIMED_BY_YOU,
      );
    }

    if (
      isReviewed &&
      submission.claimed_by &&
      submission.claimed_by !== teacherId
    ) {
      throw new ForbiddenError(
        MESSAGE.TEACHER_REVIEW.SUBMISSION_NOT_CLAIMED_BY_YOU,
      );
    }

    await teacherReviewRepository.upsertTeacherReview({
      submissionId,
      attemptId: submission.attempt_id,
      teacherId,
      overallBand: body.overallBand,
      criteriaJson: {
        taskAchievement: body.taskAchievement,
        coherenceCohesion: body.coherenceCohesion,
        lexicalResource: body.lexicalResource,
        grammaticalRangeAccuracy: body.grammaticalRangeAccuracy,
      },
      summary: body.summary.trim(),
      actionItemsJson: (body.actionItems ?? []).map((item) => item.trim()),
    });

    let reviewed = submission;

    if (!isReviewed) {
      reviewed = await teacherReviewRepository.markSubmissionReviewed(
        submissionId,
        teacherId,
      );

      await finalizeReviewFlow(reviewed);
    }

    const refreshed =
      await teacherReviewRepository.findTeacherSubmissionById(submissionId);

    return mapTeacherSubmissionDetail(refreshed);
  },

  async submitSpeakingReview(
    teacherId: string,
    submissionId: string,
    body: SpeakingReviewBody,
  ) {
    const submission =
      await teacherReviewRepository.findTeacherSubmissionById(submissionId);

    if (!submission) {
      throw new NotFoundError(MESSAGE.TEACHER_REVIEW.SUBMISSION_NOT_FOUND);
    }

    if (submission.skill !== test_type.SPEAKING) {
      throw new BadRequestError(
        MESSAGE.TEACHER_REVIEW.INVALID_SUBMISSION_SKILL,
      );
    }

    const isReviewed = submission.status === teacher_submission_status.REVIEWED;

    if (!isReviewed && submission.claimed_by !== teacherId) {
      throw new ForbiddenError(
        MESSAGE.TEACHER_REVIEW.SUBMISSION_NOT_CLAIMED_BY_YOU,
      );
    }

    if (
      isReviewed &&
      submission.claimed_by &&
      submission.claimed_by !== teacherId
    ) {
      throw new ForbiddenError(
        MESSAGE.TEACHER_REVIEW.SUBMISSION_NOT_CLAIMED_BY_YOU,
      );
    }

    await teacherReviewRepository.upsertTeacherReview({
      submissionId,
      attemptId: submission.attempt_id,
      teacherId,
      overallBand: body.overallBand,
      criteriaJson: {
        fluencyCoherence: body.fluencyCoherence,
        lexicalResource: body.lexicalResource,
        grammaticalRangeAccuracy: body.grammaticalRangeAccuracy,
        pronunciation: body.pronunciation,
      },
      summary: body.summary.trim(),
      actionItemsJson: (body.actionItems ?? []).map((item) => item.trim()),
    });

    let reviewed = submission;

    if (!isReviewed) {
      reviewed = await teacherReviewRepository.markSubmissionReviewed(
        submissionId,
        teacherId,
      );

      await finalizeReviewFlow(reviewed);
    }

    const refreshed =
      await teacherReviewRepository.findTeacherSubmissionById(submissionId);

    return mapTeacherSubmissionDetail(refreshed);
  },

  async getTeacherDashboard(teacherId: string) {
    const [pendingCount, claimedCount, reviewedCount, reviewedItems] =
      await teacherReviewRepository.countDashboardStats(teacherId);

    const totalReviewHours =
      reviewedItems.reduce((sum, item) => {
        if (!item.claimed_at || !item.reviewed_at) return sum;

        const ms =
          new Date(item.reviewed_at).getTime() -
          new Date(item.claimed_at).getTime();

        return sum + ms / (1000 * 60 * 60);
      }, 0) || 0;

    const averageSlaHours =
      reviewedItems.length > 0 ? totalReviewHours / reviewedItems.length : 0;

    return {
      pendingCount,
      claimedCount,
      reviewedCount,
      averageSlaHours: Number(averageSlaHours.toFixed(2)),
      recentReviewed: reviewedItems.map((item) => ({
        id: item.id,
        skill: item.skill,
        claimedAt: item.claimed_at,
        reviewedAt: item.reviewed_at,
      })),
    };
  },
};
