import { MESSAGE } from "../../common/constants/message.constant";
import { reportRepository } from "./report.repository";

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function resolveAttemptBand(attempt: any): number | null {
  if (
    attempt.attempt_results?.band_estimate !== null &&
    attempt.attempt_results?.band_estimate !== undefined
  ) {
    return Number(attempt.attempt_results.band_estimate);
  }

  const reviews =
    attempt.teacher_submissions?.flatMap((item: any) =>
      item.teacher_reviews ? [item.teacher_reviews] : [],
    ) ?? [];

  if (reviews.length === 0) return null;

  const total = reviews.reduce(
    (sum: number, review: any) => sum + Number(review.overall_band ?? 0),
    0,
  );

  return Number((total / reviews.length).toFixed(2));
}

function mapAttemptSummary(attempt: any) {
  return {
    id: attempt.id,
    testId: attempt.test_id,
    testTitle: attempt.tests?.title ?? null,
    mode: attempt.mode,
    status: attempt.status,
    createdAt: attempt.created_at,
    submittedAt: attempt.submitted_at,
    gradedAt: attempt.graded_at,
    band: resolveAttemptBand(attempt),
  };
}

function computeStreak(attempts: any[]) {
  const days = new Set(
    attempts.map((attempt) => {
      const date = new Date(attempt.created_at);
      return date.toISOString().slice(0, 10);
    }),
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Number(
    (values.reduce((sum, item) => sum + item, 0) / values.length).toFixed(2),
  );
}

function bandBucket(value: number | null) {
  if (value === null) return "UNKNOWN";
  const normalized = Math.max(0, Math.min(9, Math.round(value * 2) / 2));
  return normalized.toFixed(1);
}

export const reportService = {
  async getMyOverview(userId: string) {
    const attempts = await reportRepository.findUserAttempts(userId);
    const latestAttempts = attempts.slice(0, 5).map(mapAttemptSummary);

    const bands = attempts
      .map(resolveAttemptBand)
      .filter((item): item is number => item !== null);

    return {
      attemptCount: attempts.length,
      avgBand: average(bands),
      streak: computeStreak(attempts),
      latestAttempts,
    };
  },

  async getMySkills(userId: string) {
    const attempts = await reportRepository.findUserAttempts(userId);

    const grouped = {
      READING: [] as any[],
      LISTENING: [] as any[],
      WRITING: [] as any[],
      SPEAKING: [] as any[],
      FULL: [] as any[],
    };

    for (const attempt of attempts) {
      grouped[attempt.mode as keyof typeof grouped].push(attempt);
    }

    const skills = Object.entries(grouped).map(([mode, items]) => ({
      mode,
      avgBand: average(
        items
          .map(resolveAttemptBand)
          .filter((item): item is number => item !== null),
      ),
      attemptCount: items.length,
      points: items
        .slice(0, 20)
        .map((item) => ({
          attemptId: item.id,
          date: item.created_at,
          band: resolveAttemptBand(item),
        }))
        .reverse(),
    }));

    return { skills };
  },

  async getMyTimeline(userId: string, from?: string, to?: string) {
    const items = await reportRepository.findUserAttempts(
      userId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );

    return {
      timeline: items.map(mapAttemptSummary),
    };
  },

  async getTeacherOverview(teacherId: string) {
    const submissions =
      await reportRepository.findTeacherSubmissions(teacherId);

    const pendingCount = submissions.filter(
      (item) => item.status === "PENDING",
    ).length;
    const claimedCount = submissions.filter(
      (item) => item.status === "CLAIMED" && item.claimed_by === teacherId,
    ).length;
    const reviewed = submissions.filter((item) => item.status === "REVIEWED");

    const slaValues = reviewed
      .filter((item) => item.claimed_at && item.reviewed_at)
      .map((item) => {
        const ms =
          new Date(item.reviewed_at!).getTime() -
          new Date(item.claimed_at!).getTime();
        return ms / (1000 * 60 * 60);
      });

    return {
      pendingCount,
      claimedCount,
      reviewedCount: reviewed.length,
      averageSlaHours: average(slaValues),
    };
  },

  async getTeacherPerformance(teacherId: string) {
    const submissions =
      await reportRepository.findTeacherSubmissions(teacherId);

    const reviewed = submissions.filter(
      (item) =>
        item.teacher_reviews && item.teacher_reviews.teacher_id === teacherId,
    );

    const bySkill = ["WRITING", "SPEAKING"].map((skill) => {
      const items = reviewed.filter((item) => item.skill === skill);
      return {
        skill,
        reviewedCount: items.length,
        avgBand: average(
          items.map((item) => Number(item.teacher_reviews?.overall_band ?? 0)),
        ),
      };
    });

    return {
      bySkill,
      recentReviews: reviewed.slice(0, 20).map((item) => ({
        submissionId: item.id,
        skill: item.skill,
        reviewedAt: item.reviewed_at,
        overallBand: item.teacher_reviews?.overall_band
          ? Number(item.teacher_reviews.overall_band)
          : null,
      })),
    };
  },

  async getAdminOverview() {
    return reportRepository.getAdminCounts();
  },

  async getAdminAttempts() {
    const attempts = await reportRepository.findAllAttempts();

    const byStatus = Object.entries(
      attempts.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([status, count]) => ({ status, count }));

    const byMode = Object.entries(
      attempts.reduce<Record<string, number>>((acc, item) => {
        acc[item.mode] = (acc[item.mode] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([mode, count]) => ({ mode, count }));

    return {
      total: attempts.length,
      byStatus,
      byMode,
      latest: attempts.slice(0, 20).map(mapAttemptSummary),
    };
  },

  async getAdminTests() {
    const tests = await reportRepository.findAllTests();

    const byStatus = Object.entries(
      tests.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([status, count]) => ({ status, count }));

    const byType = Object.entries(
      tests.reduce<Record<string, number>>((acc, item) => {
        acc[item.type] = (acc[item.type] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([type, count]) => ({ type, count }));

    return {
      total: tests.length,
      byStatus,
      byType,
    };
  },

  async getAdminUsers() {
    const users = await reportRepository.findAllUsers();

    const byRole = Object.entries(
      users.reduce<Record<string, number>>((acc, item) => {
        acc[item.role] = (acc[item.role] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([role, count]) => ({ role, count }));

    const byStatus = Object.entries(
      users.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([status, count]) => ({ status, count }));

    return {
      total: users.length,
      byRole,
      byStatus,
    };
  },

  async getAdminTeacherGrading() {
    const submissions = await reportRepository.findAllTeacherSubmissions();

    const byStatus = Object.entries(
      submissions.reduce<Record<string, number>>((acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([status, count]) => ({ status, count }));

    const leaderboardMap = new Map<
      string,
      { teacherId: string; teacherName: string | null; reviewedCount: number }
    >();

    for (const item of submissions) {
      if (item.claimed_by && item.status === "REVIEWED") {
        const current = leaderboardMap.get(item.claimed_by) ?? {
          teacherId: item.claimed_by,
          teacherName: item.users?.full_name ?? null,
          reviewedCount: 0,
        };
        current.reviewedCount += 1;
        leaderboardMap.set(item.claimed_by, current);
      }
    }

    return {
      total: submissions.length,
      byStatus,
      leaderboard: Array.from(leaderboardMap.values()).sort(
        (a, b) => b.reviewedCount - a.reviewedCount,
      ),
    };
  },

  async getAdminBandsDistribution() {
    const [attempts, reviews] = await Promise.all([
      reportRepository.findAllAttempts(),
      reportRepository.findAllTeacherReviews(),
    ]);

    const counts = new Map<string, number>();

    for (const attempt of attempts) {
      const bucket = bandBucket(resolveAttemptBand(attempt));
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }

    for (const review of reviews) {
      const bucket = bandBucket(
        review.overall_band !== null && review.overall_band !== undefined
          ? Number(review.overall_band)
          : null,
      );
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }

    return {
      distribution: Array.from(counts.entries())
        .map(([band, count]) => ({ band, count }))
        .sort((a, b) => a.band.localeCompare(b.band)),
    };
  },
};
