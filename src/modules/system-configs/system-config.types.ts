import { DEFAULT_SYSTEM_CONFIG } from "../../common/constants/system-config.constant";

export type FeatureFlags = typeof DEFAULT_SYSTEM_CONFIG.featureFlags;

export type SystemConfigShape = {
  readingDefaultSec: number;
  listeningDefaultSec: number;
  writingDefaultSec: number;
  speakingDefaultSec: number;
  fullTestDefaultSec: number;

  readingCustomMinSec: number;
  readingCustomMaxSec: number;
  listeningCustomMinSec: number;
  listeningCustomMaxSec: number;
  writingCustomMinSec: number;
  writingCustomMaxSec: number;
  speakingCustomMinSec: number;
  speakingCustomMaxSec: number;
  fullTestCustomMinSec: number;
  fullTestCustomMaxSec: number;

  featureFlags: FeatureFlags;
};

export type PatchSystemConfigBody = Partial<SystemConfigShape> & {
  featureFlags?: Partial<FeatureFlags>;
};

export type SystemConfigKey = keyof SystemConfigShape;
