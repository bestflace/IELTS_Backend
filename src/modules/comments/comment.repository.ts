import { comment_status } from "@prisma/client";
import { prisma } from "../../config/prisma";

export const commentRepository = {
  findAttemptById(attemptId: string) {
    return prisma.attempts.findUnique({
      where: { id: attemptId },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });
  },

  findCommentsByAttemptId(attemptId: string) {
    return prisma.attempt_comments.findMany({
      where: {
        attempt_id: attemptId,
        status: {
          not: comment_status.DELETED,
        },
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
            role: true,
          },
        },
      },
      orderBy: [{ created_at: "asc" }],
    });
  },

  findCommentById(commentId: string) {
    return prisma.attempt_comments.findUnique({
      where: { id: commentId },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
            role: true,
          },
        },
        attempts: true,
      },
    });
  },

  createComment(data: {
    attempt_id: string;
    user_id: string;
    parent_id?: string | null;
    content: string;
  }) {
    return prisma.attempt_comments.create({
      data: {
        attempt_id: data.attempt_id,
        user_id: data.user_id,
        parent_id: data.parent_id ?? null,
        content: data.content,
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    });
  },

  updateComment(commentId: string, content: string) {
    return prisma.attempt_comments.update({
      where: { id: commentId },
      data: {
        content,
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    });
  },

  softDeleteComment(commentId: string) {
    return prisma.attempt_comments.update({
      where: { id: commentId },
      data: {
        status: comment_status.DELETED,
        content: "[deleted]",
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  },

  hideComment(commentId: string) {
    return prisma.attempt_comments.update({
      where: { id: commentId },
      data: {
        status: comment_status.HIDDEN,
        updated_at: new Date(),
      },
    });
  },

  unhideComment(commentId: string) {
    return prisma.attempt_comments.update({
      where: { id: commentId },
      data: {
        status: comment_status.ACTIVE,
        updated_at: new Date(),
      },
    });
  },
};
