import type { FieldSide } from "../types";

type PointSideContext = {
  field_side?: FieldSide | string | null;
  starting_on_offense: boolean;
  won: boolean | null;
};

export const DEFAULT_FIELD_SIDE: FieldSide = "table_left";

export function normalizeFieldSide(value?: FieldSide | string | null): FieldSide | null {
  if (value === "table_left" || value === "table_right") {
    return value;
  }
  return null;
}

export function getOppositeFieldSide(fieldSide: FieldSide): FieldSide {
  return fieldSide === "table_left" ? "table_right" : "table_left";
}

export function inferNextFieldSide(lastCompletedPoint?: PointSideContext | null): FieldSide | null {
  if (!lastCompletedPoint || lastCompletedPoint.won === null) {
    return null;
  }

  const normalizedFieldSide = normalizeFieldSide(lastCompletedPoint.field_side);
  if (!normalizedFieldSide) {
    return null;
  }

  // Teams switch defended end zones between points, so the next starting side alternates.
  return getOppositeFieldSide(normalizedFieldSide);
}
