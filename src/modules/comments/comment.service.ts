import { comment_status, test_type } from "@prisma/client";
import { MESSAGE } from "../../common/constants/message.constant";
import { ForbiddenError } from "../../common/errors/forbidden.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import {
  buildPaginationMeta,
  parsePagination,
} from "../../common/utils/pagination";
import { commentRepository } from "./comment.repository";

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function canAccessAttempt(role: string, userId: string, attempt: any) {
  if (role === "ADMIN" || role === "TEACHER") return true;
  return attempt.user_id === userId;
}

function mapComment(comment: any, canModerate = false) {
  const hidden = comment.status === comment_status.HIDDEN;

  return {
    id: comment.id,
    attemptId: comment.attempt_id,
    userId: comment.user_id,
    parentId: comment.parent_id,
    content: hidden && !canModerate ? null : comment.content,
    status: comment.status,
    isHidden: hidden,
    hiddenMessage:
      hidden && !canModerate ? "Quản trị viên đã ẩn bình luận này." : null,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    deletedAt: comment.deleted_at,
    author: comment.users
      ? {
          id: comment.users.id,
          fullName: comment.users.full_name,
          email: comment.users.email,
          avatarUrl: comment.users.avatar_url,
          role: comment.users.role,
        }
      : null,
    submissionId: comment.attempts?.teacher_submissions?.[0]?.id ?? null,
    submission: comment.attempts?.teacher_submissions?.[0]
      ? {
          id: comment.attempts.teacher_submissions[0].id,
          skill: comment.attempts.teacher_submissions[0].skill,
          status: comment.attempts.teacher_submissions[0].status,
        }
      : null,
    children: [] as any[],
  };
}

function mapAdminComment(comment: any) {
  const submission = comment.attempts?.teacher_submissions?.[0] || null;
  return {
    id: comment.id,
    attemptId: comment.attempt_id,
    userId: comment.user_id,
    parentId: comment.parent_id,
    content: comment.content,
    status: comment.status,
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
    deletedAt: comment.deleted_at,
    author: comment.users
      ? {
          id: comment.users.id,
          fullName: comment.users.full_name,
          email: comment.users.email,
          avatarUrl: comment.users.avatar_url,
          role: comment.users.role,
        }
      : null,
    user: comment.users
      ? {
          id: comment.users.id,
          fullName: comment.users.full_name,
          email: comment.users.email,
          avatarUrl: comment.users.avatar_url,
          role: comment.users.role,
        }
      : null,
    attempt: comment.attempts
      ? {
          id: comment.attempts.id,
          testId: comment.attempts.test_id,
          test: comment.attempts.tests
            ? {
                id: comment.attempts.tests.id,
                title: comment.attempts.tests.title,
                type: comment.attempts.tests.type,
              }
            : null,
        }
      : null,
    submissionId: submission?.id || null,
    submission: submission
      ? {
          id: submission.id,
          skill: submission.skill,
          status: submission.status,
        }
      : null,
  };
}

function getSnapshotSections(attempt: any) {
  const snapshot =
    attempt?.attempt_snapshots?.test_snapshot_json ||
    attempt?.attemptSnapshot?.testSnapshotJson ||
    attempt?.snapshot ||
    null;

  if (!snapshot || typeof snapshot !== "object") {
    return [];
  }

  if (Array.isArray(snapshot.sections)) return snapshot.sections;
  if (Array.isArray(snapshot.testSections)) return snapshot.testSections;
  if (Array.isArray(snapshot.test_sections)) return snapshot.test_sections;

  return [];
}

function hasWritingSection(section: any) {
  return Boolean(
    section?.writingTask ||
    section?.writing_task ||
    section?.writing_tasks ||
    section?.writingTaskId ||
    section?.writing_task_id,
  );
}

function hasSpeakingSection(section: any) {
  return Boolean(
    section?.speakingSet ||
    section?.speaking_set ||
    section?.speaking_sets ||
    section?.speakingSetId ||
    section?.speaking_set_id,
  );
}

function inferTeacherSkillsFromAttempt(attempt: any) {
  const skills = new Set<test_type>();

  for (const submission of attempt?.teacher_submissions || []) {
    if (
      submission?.skill === test_type.WRITING ||
      submission?.skill === test_type.SPEAKING
    ) {
      skills.add(submission.skill);
    }
  }

  if (attempt?.mode === test_type.WRITING) {
    skills.add(test_type.WRITING);
  }

  if (attempt?.mode === test_type.SPEAKING) {
    skills.add(test_type.SPEAKING);
  }

  const sections = getSnapshotSections(attempt);

  if (sections.some(hasWritingSection)) {
    skills.add(test_type.WRITING);
  }

  if (sections.some(hasSpeakingSection)) {
    skills.add(test_type.SPEAKING);
  }

  return Array.from(skills);
}

async function ensureCommentSubmissionLinks(attempt: any) {
  if (!attempt?.id) return [];

  const existingSubmissions = attempt.teacher_submissions || [];
  const existingSkills = new Set(
    existingSubmissions.map((item: any) => item.skill),
  );
  const inferredSkills = inferTeacherSkillsFromAttempt(attempt);
  const missingSkills = inferredSkills.filter(
    (skill) => !existingSkills.has(skill),
  );

  if (missingSkills.length > 0) {
    await commentRepository.ensureTeacherSubmissionsForAttempt(
      attempt.id,
      missingSkills,
    );
  }

  return commentRepository.findTeachersForAttemptComment(attempt.id);
}

function pickPrimarySubmission(submissions: any[]) {
  return (
    submissions.find((item) => item.skill === test_type.WRITING) ||
    submissions.find((item) => item.skill === test_type.SPEAKING) ||
    submissions[0] ||
    null
  );
}

function buildTree(comments: any[], canModerate = false) {
  const mapped = comments.map((comment) => mapComment(comment, canModerate));
  const map = new Map(mapped.map((item) => [item.id, item]));

  const roots: any[] = [];

  for (const item of mapped) {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(item);
    } else {
      roots.push(item);
    }
  }

  return roots;
}

async function notifyAfterCommentCreated(params: {
  actorUserId: string;
  actorRole: string;
  attemptId: string;
  commentId: string;
  parentId?: string | null;
}) {
  const attempt = await commentRepository.findAttemptOwner(params.attemptId);

  if (!attempt) return;

  if (params.actorRole === "USER" || params.actorRole === "LEARNER") {
    const teacherSubmissions = await ensureCommentSubmissionLinks(attempt);

    const assignedTeacherTargets = teacherSubmissions
      .flatMap((item) => {
        const ids = [item.claimed_by, item.teacher_reviews?.teacher_id].filter(
          Boolean,
        ) as string[];

        return ids.map((teacherId) => ({
          teacherId,
          submissionId: item.id,
          skill: item.skill,
        }));
      })
      .filter((item) => item.teacherId !== params.actorUserId);

    let teacherTargets = Array.from(
      new Map(
        assignedTeacherTargets.map((item) => [
          `${item.teacherId}-${item.submissionId}`,
          item,
        ]),
      ).values(),
    );

    if (teacherTargets.length === 0 && teacherSubmissions.length > 0) {
      const primarySubmission = pickPrimarySubmission(teacherSubmissions);
      const teachers = await commentRepository.findActiveTeachers();

      teacherTargets = teachers
        .filter((teacher) => teacher.id !== params.actorUserId)
        .map((teacher) => ({
          teacherId: teacher.id,
          submissionId: primarySubmission.id,
          skill: primarySubmission.skill,
        }));
    }

    if (teacherTargets.length) {
      await commentRepository.createManyCommentNotifications(
        teacherTargets.map((item) => ({
          userId: item.teacherId,
          title: "Có bình luận mới từ học viên",
          message: `Học viên vừa gửi câu hỏi dưới bài làm "${attempt.tests?.title ?? "IELTS"}".`,
          dataJson: {
            kind: "ATTEMPT_COMMENT",
            attemptId: attempt.id,
            submissionId: item.submissionId,
            commentId: params.commentId,
            skill: item.skill,
          },
        })),
      );
    }

    const primarySubmission = pickPrimarySubmission(teacherSubmissions);
    const admins = await commentRepository.findAdmins();

    await commentRepository.createManyCommentNotifications(
      admins
        .filter((admin) => admin.id !== params.actorUserId)
        .map((admin) => ({
          userId: admin.id,
          title: "Có bình luận mới cần theo dõi",
          message: `Học viên vừa gửi bình luận dưới bài làm "${attempt.tests?.title ?? "IELTS"}".`,
          dataJson: {
            kind: "ATTEMPT_COMMENT",
            attemptId: attempt.id,
            submissionId: primarySubmission?.id ?? null,
            commentId: params.commentId,
            skill: primarySubmission?.skill ?? null,
          },
        })),
    );

    return;
  }

  if (attempt.user_id && attempt.user_id !== params.actorUserId) {
    await commentRepository.createCommentNotification({
      userId: attempt.user_id,
      title:
        params.actorRole === "TEACHER"
          ? "Giáo viên đã phản hồi bình luận"
          : "Bình luận của bạn có phản hồi mới",
      message:
        params.actorRole === "TEACHER"
          ? "Giáo viên vừa trả lời câu hỏi của bạn dưới bài làm."
          : "Có phản hồi mới dưới bài làm của bạn.",
      dataJson: {
        kind: "ATTEMPT_COMMENT_REPLY",
        attemptId: attempt.id,
        commentId: params.commentId,
      },
    });
  }
}

export const commentService = {
  async getAttemptComments(userId: string, role: string, attemptId: string) {
    const attempt = await commentRepository.findAttemptById(attemptId);

    if (!attempt) {
      throw new NotFoundError(MESSAGE.COMMENT.ATTEMPT_NOT_FOUND);
    }

    if (!canAccessAttempt(role, userId, attempt)) {
      throw new ForbiddenError(MESSAGE.COMMENT.FORBIDDEN);
    }

    const comments = await commentRepository.findCommentsByAttemptId(attemptId);
    return buildTree(comments, role === "ADMIN");
  },

  async createComment(
    userId: string,
    role: string,
    attemptId: string,
    body: { content: string; parentId?: string | null },
  ) {
    const attempt = await commentRepository.findAttemptById(attemptId);

    if (!attempt) {
      throw new NotFoundError(MESSAGE.COMMENT.ATTEMPT_NOT_FOUND);
    }

    if (!canAccessAttempt(role, userId, attempt)) {
      throw new ForbiddenError(MESSAGE.COMMENT.FORBIDDEN);
    }

    if (body.parentId) {
      const parent = await commentRepository.findCommentById(body.parentId);

      if (
        !parent ||
        parent.attempt_id !== attemptId ||
        parent.status === comment_status.DELETED
      ) {
        throw new NotFoundError(MESSAGE.COMMENT.PARENT_NOT_FOUND);
      }
    }

    const created = await commentRepository.createComment({
      attempt_id: attemptId,
      user_id: userId,
      parent_id: body.parentId ?? null,
      content: normalizeText(body.content),
    });

    await notifyAfterCommentCreated({
      actorUserId: userId,
      actorRole: role,
      attemptId,
      commentId: created.id,
      parentId: body.parentId ?? null,
    });

    const freshComment = await commentRepository.findCommentById(created.id);

    return mapComment(freshComment || created);
  },

  async updateComment(
    userId: string,
    role: string,
    commentId: string,
    body: { content: string },
  ) {
    const comment = await commentRepository.findCommentById(commentId);

    if (!comment || comment.status === comment_status.DELETED) {
      throw new NotFoundError(MESSAGE.COMMENT.NOT_FOUND);
    }

    if (role !== "ADMIN" && comment.user_id !== userId) {
      throw new ForbiddenError(MESSAGE.COMMENT.FORBIDDEN);
    }

    const updated = await commentRepository.updateComment(
      commentId,
      normalizeText(body.content),
    );
    return mapComment(updated);
  },

  async deleteComment(userId: string, role: string, commentId: string) {
    const comment = await commentRepository.findCommentById(commentId);

    if (!comment || comment.status === comment_status.DELETED) {
      throw new NotFoundError(MESSAGE.COMMENT.NOT_FOUND);
    }

    if (role !== "ADMIN" && comment.user_id !== userId) {
      throw new ForbiddenError(MESSAGE.COMMENT.FORBIDDEN);
    }

    await commentRepository.softDeleteComment(commentId);

    return { success: true };
  },

  async hideComment(commentId: string) {
    const comment = await commentRepository.findCommentById(commentId);

    if (!comment || comment.status === comment_status.DELETED) {
      throw new NotFoundError(MESSAGE.COMMENT.NOT_FOUND);
    }

    await commentRepository.hideComment(commentId);
    return { success: true };
  },

  async unhideComment(commentId: string) {
    const comment = await commentRepository.findCommentById(commentId);

    if (!comment) {
      throw new NotFoundError(MESSAGE.COMMENT.NOT_FOUND);
    }

    await commentRepository.unhideComment(commentId);
    return { success: true };
  },

  async getAdminComments(query: {
    page?: number;
    limit?: number;
    status?: comment_status;
    search?: string;
  }) {
    const pagination = parsePagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      commentRepository.findAdminComments({
        skip: pagination.skip,
        take: pagination.limit,
        status: query.status,
        search: query.search?.trim() || undefined,
      }),
      commentRepository.countAdminComments({
        status: query.status,
        search: query.search?.trim() || undefined,
      }),
    ]);

    const needsBackfill = items.some((comment: any) => {
      const attempt = comment.attempts;
      return (
        attempt &&
        (attempt.teacher_submissions || []).length === 0 &&
        inferTeacherSkillsFromAttempt(attempt).length > 0
      );
    });

    if (needsBackfill) {
      await Promise.all(
        items.map(async (comment: any) => {
          const attempt = comment.attempts;

          if (!attempt || (attempt.teacher_submissions || []).length > 0) {
            return;
          }

          const skills = inferTeacherSkillsFromAttempt(attempt);

          if (skills.length > 0) {
            await commentRepository.ensureTeacherSubmissionsForAttempt(
              attempt.id,
              skills,
            );
          }
        }),
      );
    }

    const hydratedItems = needsBackfill
      ? await commentRepository.findAdminComments({
          skip: pagination.skip,
          take: pagination.limit,
          status: query.status,
          search: query.search?.trim() || undefined,
        })
      : items;

    return {
      items: hydratedItems.map(mapAdminComment),
      meta: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        total,
      }),
    };
  },
};
