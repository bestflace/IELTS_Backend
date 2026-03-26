import {
  DEFAULT_SYSTEM_CONFIG,
  PUBLIC_SYSTEM_CONFIG_KEYS,
} from "../../common/constants/system-config.constant";
import { MESSAGE } from "../../common/constants/message.constant";
import { BadRequestError } from "../../common/errors/bad-request.error";
import {
  PatchSystemConfigBody,
  SystemConfigShape,
} from "./system-config.types";
import { systemConfigRepository } from "./system-config.repository";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildConfigFromRows(
  rows: Array<{ key: string; value_json: unknown }>,
): SystemConfigShape {
  const merged: SystemConfigShape = {
    ...DEFAULT_SYSTEM_CONFIG,
    featureFlags: {
      ...DEFAULT_SYSTEM_CONFIG.featureFlags,
    },
  };

  for (const row of rows) {
    if (row.key === "featureFlags" && isPlainObject(row.value_json)) {
      merged.featureFlags = {
        ...merged.featureFlags,
        ...(row.value_json as Record<string, boolean>),
      };
      continue;
    }

    if (row.key in merged) {
      (merged as Record<string, unknown>)[row.key] = row.value_json;
    }
  }

  return merged;
}

function assertPositiveValues(config: SystemConfigShape) {
  const values = [
    config.readingDefaultSec,
    config.listeningDefaultSec,
    config.writingDefaultSec,
    config.speakingDefaultSec,
    config.fullTestDefaultSec,

    config.readingCustomMinSec,
    config.readingCustomMaxSec,
    config.listeningCustomMinSec,
    config.listeningCustomMaxSec,
    config.writingCustomMinSec,
    config.writingCustomMaxSec,
    config.speakingCustomMinSec,
    config.speakingCustomMaxSec,
    config.fullTestCustomMinSec,
    config.fullTestCustomMaxSec,
  ];

  const hasInvalidValue = values.some(
    (value) => !Number.isInteger(value) || value <= 0,
  );

  if (hasInvalidValue) {
    throw new BadRequestError(MESSAGE.SYSTEM_CONFIG.INVALID_TIMING_VALUE);
  }
}

function assertTimingRanges(config: SystemConfigShape) {
  const invalid =
    config.readingCustomMinSec > config.readingDefaultSec ||
    config.readingDefaultSec > config.readingCustomMaxSec ||
    config.listeningCustomMinSec > config.listeningDefaultSec ||
    config.listeningDefaultSec > config.listeningCustomMaxSec ||
    config.writingCustomMinSec > config.writingDefaultSec ||
    config.writingDefaultSec > config.writingCustomMaxSec ||
    config.speakingCustomMinSec > config.speakingDefaultSec ||
    config.speakingDefaultSec > config.speakingCustomMaxSec ||
    config.fullTestCustomMinSec > config.fullTestDefaultSec ||
    config.fullTestDefaultSec > config.fullTestCustomMaxSec;

  if (invalid) {
    throw new BadRequestError(MESSAGE.SYSTEM_CONFIG.INVALID_TIMING_RANGE);
  }
}

function pickPublicConfig(config: SystemConfigShape) {
  return PUBLIC_SYSTEM_CONFIG_KEYS.reduce((acc, key) => {
    (acc as Record<string, unknown>)[key] = config[key];
    return acc;
  }, {} as Partial<SystemConfigShape>);
}

export const systemConfigService = {
  async getPublicConfig() {
    const rows = await systemConfigRepository.findMany([
      ...PUBLIC_SYSTEM_CONFIG_KEYS,
    ]);
    const config = buildConfigFromRows(rows);
    return pickPublicConfig(config);
  },

  async getAdminConfig() {
    const rows = await systemConfigRepository.findMany();
    return buildConfigFromRows(rows);
  },

  async updateConfig(updatedBy: string, body: PatchSystemConfigBody) {
    const currentRows = await systemConfigRepository.findMany();
    const currentConfig = buildConfigFromRows(currentRows);

    const nextConfig: SystemConfigShape = {
      ...currentConfig,
      ...body,
      featureFlags: {
        ...currentConfig.featureFlags,
        ...(body.featureFlags ?? {}),
      },
    };

    assertPositiveValues(nextConfig);
    assertTimingRanges(nextConfig);

    const entries = Object.entries(body).map(([key, value]) => {
      if (key === "featureFlags") {
        return {
          key,
          value: nextConfig.featureFlags,
        };
      }

      return {
        key,
        value,
      };
    });

    await systemConfigRepository.upsertMany(entries, updatedBy);

    return nextConfig;
  },
};
