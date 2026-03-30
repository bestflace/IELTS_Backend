import { prisma } from "../../config/prisma";

export const reportRepository = {
  findUserAttempts(userId: string, from?: Date, to?: Date) {
    return prisma.attempts.findMany({
      where: {
        user_id: userId,
        ...(from || to
          ? {
              created_at: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      include: {
        tests: true,
        attempt_results: true,
        teacher_submissions: {
          include: {
            teacher_reviews: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },

  findTeacherSubmissions(teacherId: string) {
    return prisma.teacher_submissions.findMany({
      where: {
        OR: [
          { claimed_by: teacherId },
          { teacher_reviews: { teacher_id: teacherId } },
        ],
      },
      include: {
        teacher_reviews: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },

  async getAdminCounts() {
    const [
      totalUsers,
      totalTests,
      totalAttempts,
      totalBlogs,
      pendingTeacherSubmissions,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.tests.count(),
      prisma.attempts.count(),
      prisma.blogs.count(),
      prisma.teacher_submissions.count({
        where: {
          status: "PENDING",
        },
      }),
    ]);

    return {
      totalUsers,
      totalTests,
      totalAttempts,
      totalBlogs,
      pendingTeacherSubmissions,
    };
  },

  findAllAttempts() {
    return prisma.attempts.findMany({
      include: {
        attempt_results: true,
        teacher_submissions: {
          include: {
            teacher_reviews: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },

  findAllTests() {
    return prisma.tests.findMany();
  },

  findAllUsers() {
    return prisma.users.findMany();
  },

  findAllTeacherSubmissions() {
    return prisma.teacher_submissions.findMany({
      include: {
        users: true,
        teacher_reviews: true,
      },
    });
  },

  findAllTeacherReviews() {
    return prisma.teacher_reviews.findMany();
  },
};
