import type { TFunction } from "i18next";

import type { TurnoverType } from "../types";

const TURNOVER_TYPES_SET = new Set<TurnoverType>([
  "defended_pass",
  "missed_pass",
  "defended_huck",
  "missed_huck",
  "drop",
  "stall_out",
  "miscommunication",
  "other",
]);

export const TURNOVER_TYPES: TurnoverType[] = [
  "defended_pass",
  "missed_pass",
  "defended_huck",
  "missed_huck",
  "drop",
  "stall_out",
  "miscommunication",
  "other",
];

export const normalizeTurnoverType = (value?: string | null): TurnoverType => {
  if (value && TURNOVER_TYPES_SET.has(value as TurnoverType)) {
    return value as TurnoverType;
  }
  return "other";
};

export const getTurnoverTypeLabel = (
  t: TFunction,
  value?: string | null,
): string => t(`points:turnoverTypes.${normalizeTurnoverType(value)}`);
