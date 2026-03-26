import { z } from "zod";

const positiveIntSchema = z.number().int().positive();

const featureFlagsSchema = z
  .object({
    enableBlog: z.boolean().optional(),
    enableTeacherReview: z.boolean().optional(),
    enableWritingAI: z.boolean().optional(),
    enableSpeakingASR: z.boolean().optional(),
    enableSpeakingAI: z.boolean().optional(),
    enableImports: z.boolean().optional(),
    enableNotifications: z.boolean().optional(),
  })
  .strict();

export const patchSystemConfigSchema = z
  .object({
    readingDefaultSec: positiveIntSchema.optional(),
    listeningDefaultSec: positiveIntSchema.optional(),
    writingDefaultSec: positiveIntSchema.optional(),
    speakingDefaultSec: positiveIntSchema.optional(),
    fullTestDefaultSec: positiveIntSchema.optional(),

    readingCustomMinSec: positiveIntSchema.optional(),
    readingCustomMaxSec: positiveIntSchema.optional(),
    listeningCustomMinSec: positiveIntSchema.optional(),
    listeningCustomMaxSec: positiveIntSchema.optional(),
    writingCustomMinSec: positiveIntSchema.optional(),
    writingCustomMaxSec: positiveIntSchema.optional(),
    speakingCustomMinSec: positiveIntSchema.optional(),
    speakingCustomMaxSec: positiveIntSchema.optional(),
    fullTestCustomMinSec: positiveIntSchema.optional(),
    fullTestCustomMaxSec: positiveIntSchema.optional(),

    featureFlags: featureFlagsSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
    path: ["readingDefaultSec"],
  });
