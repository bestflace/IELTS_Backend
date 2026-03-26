export const SYSTEM_CONFIG_KEYS = {
  READING_DEFAULT_SEC: "readingDefaultSec",
  LISTENING_DEFAULT_SEC: "listeningDefaultSec",
  WRITING_DEFAULT_SEC: "writingDefaultSec",
  SPEAKING_DEFAULT_SEC: "speakingDefaultSec",
  FULL_TEST_DEFAULT_SEC: "fullTestDefaultSec",

  READING_CUSTOM_MIN_SEC: "readingCustomMinSec",
  READING_CUSTOM_MAX_SEC: "readingCustomMaxSec",
  LISTENING_CUSTOM_MIN_SEC: "listeningCustomMinSec",
  LISTENING_CUSTOM_MAX_SEC: "listeningCustomMaxSec",
  WRITING_CUSTOM_MIN_SEC: "writingCustomMinSec",
  WRITING_CUSTOM_MAX_SEC: "writingCustomMaxSec",
  SPEAKING_CUSTOM_MIN_SEC: "speakingCustomMinSec",
  SPEAKING_CUSTOM_MAX_SEC: "speakingCustomMaxSec",
  FULL_TEST_CUSTOM_MIN_SEC: "fullTestCustomMinSec",
  FULL_TEST_CUSTOM_MAX_SEC: "fullTestCustomMaxSec",

  FEATURE_FLAGS: "featureFlags",
} as const;

export const DEFAULT_SYSTEM_CONFIG = {
  readingDefaultSec: 3600,
  listeningDefaultSec: 1800,
  writingDefaultSec: 3600,
  speakingDefaultSec: 900,
  fullTestDefaultSec: 9900,

  readingCustomMinSec: 600,
  readingCustomMaxSec: 5400,
  listeningCustomMinSec: 600,
  listeningCustomMaxSec: 3600,
  writingCustomMinSec: 900,
  writingCustomMaxSec: 5400,
  speakingCustomMinSec: 300,
  speakingCustomMaxSec: 1800,
  fullTestCustomMinSec: 1800,
  fullTestCustomMaxSec: 14400,

  featureFlags: {
    enableBlog: true,
    enableTeacherReview: true,
    enableWritingAI: true,
    enableSpeakingASR: true,
    enableSpeakingAI: true,
    enableImports: true,
    enableNotifications: true,
  },
} as const;

export const PUBLIC_SYSTEM_CONFIG_KEYS = [
  SYSTEM_CONFIG_KEYS.READING_DEFAULT_SEC,
  SYSTEM_CONFIG_KEYS.LISTENING_DEFAULT_SEC,
  SYSTEM_CONFIG_KEYS.WRITING_DEFAULT_SEC,
  SYSTEM_CONFIG_KEYS.SPEAKING_DEFAULT_SEC,
  SYSTEM_CONFIG_KEYS.FULL_TEST_DEFAULT_SEC,

  SYSTEM_CONFIG_KEYS.READING_CUSTOM_MIN_SEC,
  SYSTEM_CONFIG_KEYS.READING_CUSTOM_MAX_SEC,
  SYSTEM_CONFIG_KEYS.LISTENING_CUSTOM_MIN_SEC,
  SYSTEM_CONFIG_KEYS.LISTENING_CUSTOM_MAX_SEC,
  SYSTEM_CONFIG_KEYS.WRITING_CUSTOM_MIN_SEC,
  SYSTEM_CONFIG_KEYS.WRITING_CUSTOM_MAX_SEC,
  SYSTEM_CONFIG_KEYS.SPEAKING_CUSTOM_MIN_SEC,
  SYSTEM_CONFIG_KEYS.SPEAKING_CUSTOM_MAX_SEC,
  SYSTEM_CONFIG_KEYS.FULL_TEST_CUSTOM_MIN_SEC,
  SYSTEM_CONFIG_KEYS.FULL_TEST_CUSTOM_MAX_SEC,

  SYSTEM_CONFIG_KEYS.FEATURE_FLAGS,
] as const;
