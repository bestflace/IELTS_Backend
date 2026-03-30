import { comment_status } from "@prisma/client";
import { MESSAGE } from "../../common/constants/message.constant";
import { ForbiddenError } from "../../common/errors/forbidden.error";
import { NotFoundError } from "../../common/errors/not-found.error";
import { commentRepository } from "./comment.repository";

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function canAccessAttempt(role: string, userId: string, attempt: any) {
  if (role === "ADMIN" || role === "TEACHER") return true;
  return attempt.user_id === userId;
}

function mapComment(comment: any) {
  return {
    id: comment.id,
    attemptId: comment.attempt_id,
    userId: comment.user_id,
    parentId: comment.parent_id,
    content: comment.status === comment_status.HIDDEN ? null : comment.content,
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
    children: [] as any[],
  };
}

function buildTree(comments: any[]) {
  const mapped = comments.map(mapComment);
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
    return buildTree(comments);
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

    return mapComment(created);
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
};
