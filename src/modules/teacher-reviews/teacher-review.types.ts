export type TeacherSubmissionListQuery = {
  page?: number;
  limit?: number;
  skill?: "WRITING" | "SPEAKING";
  status?: "PENDING" | "CLAIMED" | "REVIEWED";
  mine?: boolean;
};

export type WritingReviewBody = {
  overallBand: number;
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRangeAccuracy: number;
  summary: string;
  actionItems?: string[];
};

export type SpeakingReviewBody = {
  overallBand: number;
  fluencyCoherence: number;
  lexicalResource: number;
  grammaticalRangeAccuracy: number;
  pronunciation: number;
  summary: string;
  actionItems?: string[];
};
