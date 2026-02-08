import type { TFunction } from "i18next";

import type { StoppageType } from "../types";

const STOPPAGE_TYPES_SET = new Set<StoppageType>(["call", "injury", "timeout", "other"]);

export const STOPPAGE_TYPES: StoppageType[] = ["call", "injury", "timeout", "other"];

export const normalizeStoppageType = (value?: string | null): StoppageType => {
  if (value && STOPPAGE_TYPES_SET.has(value as StoppageType)) {
    return value as StoppageType;
  }
  return "call";
};

export const getStoppageTypeLabel = (
  t: TFunction,
  value?: string | null,
): string => t(`points:stoppageTypes.${normalizeStoppageType(value)}`);
