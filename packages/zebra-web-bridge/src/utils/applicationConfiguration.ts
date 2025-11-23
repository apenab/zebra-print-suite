import type {
  ApplicationConfiguration,
  ApplicationInfo,
  SupportedConversionMap,
} from "../types";
import { isRecord } from "./deviceNormalization";

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" ? value : undefined;

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
};

const normalizeSupportedConversions = (
  value: unknown
): SupportedConversionMap => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<SupportedConversionMap>(
    (accumulator, [key, conversions]) => {
      const normalized = normalizeStringArray(conversions);

      if (normalized.length) {
        accumulator[key] = normalized;
      }

      return accumulator;
    },
    {}
  );
};

const normalizeApplication = (value: unknown): ApplicationInfo | null => {
  if (!isRecord(value)) {
    return null;
  }

  return {
    version: asString(value.version),
    buildNumber: asNumber(value.buildNumber ?? value.build_number),
    apiLevel: asNumber(value.apiLevel ?? value.api_level),
    platform: asString(value.platform),
    supportedConversions: normalizeSupportedConversions(
      value.supportedConversions ?? value.supported_conversions
    ),
  };
};

export const normalizeApplicationConfiguration = (
  value: unknown
): ApplicationConfiguration | null => {
  if (!isRecord(value)) {
    return null;
  }

  const application = normalizeApplication(value.application);

  if (!application) {
    return null;
  }

  return {
    application,
  };
};
