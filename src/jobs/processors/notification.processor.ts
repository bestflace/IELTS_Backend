import { prisma } from "../../config/prisma";

export async function processTestPublishedNotification(testId: string) {
  const test = await prisma.tests.findUnique({
    where: { id: testId },
  });

  if (!test) {
    throw new Error(`Test ${testId} not found`);
  }

  const users = await prisma.users.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });

  if (users.length === 0) {
    return { sentCount: 0 };
  }

  const result = await prisma.notifications.createMany({
    data: users.map((user) => ({
      user_id: user.id,
      type: "TEST_PUBLISHED",
      title: "A new test has been published",
      message: `New test available: ${test.title}`,
      data_json: {
        testId: test.id,
        title: test.title,
        type: test.type,
      } as any,
    })),
  });

  return {
    sentCount: result.count,
  };
}

export async function processSubmissionReviewedNotification(attemptId: string) {
  const attempt = await prisma.attempts.findUnique({
    where: { id: attemptId },
    include: {
      tests: true,
      users: true,
    },
  });

  if (!attempt) {
    throw new Error(`Attempt ${attemptId} not found`);
  }

  await prisma.notifications.create({
    data: {
      user_id: attempt.user_id,
      type: "TEACHER_REVIEW_DONE",
      title: "Your submission has been reviewed",
      message: `Your submission for test "${attempt.tests.title}" has been reviewed.`,
      data_json: {
        attemptId: attempt.id,
        testId: attempt.test_id,
      } as any,
    },
  });

  return { sentCount: 1 };
}
