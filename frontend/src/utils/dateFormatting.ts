export type DateFormatType = "shortDate" | "monthDay";

const DATE_FORMAT_OPTIONS: Record<DateFormatType, Intl.DateTimeFormatOptions> = {
  shortDate: { month: "short", day: "numeric", year: "numeric" },
  monthDay: { month: "short", day: "numeric" },
};

function normalizeLocale(locale?: string): string {
  if (!locale) {
    return "en-US";
  }

  return locale.startsWith("fr") ? "fr-FR" : "en-US";
}

function resolveDate(date: string | Date | null | undefined): Date | null {
  if (!date) {
    return null;
  }

  const resolvedDate = date instanceof Date ? date : new Date(date);
  return Number.isNaN(resolvedDate.getTime()) ? null : resolvedDate;
}

export function formatDate(
  date: string | Date | null | undefined,
  locale?: string,
  format: DateFormatType = "shortDate"
): string {
  const resolvedDate = resolveDate(date);
  if (!resolvedDate) {
    return "-";
  }

  return resolvedDate.toLocaleDateString(normalizeLocale(locale), DATE_FORMAT_OPTIONS[format]);
}

interface DateRangeOptions {
  startFormat?: DateFormatType;
  endFormat?: DateFormatType;
}

export function formatDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
  locale?: string,
  options?: DateRangeOptions
): string {
  const start = formatDate(startDate, locale, options?.startFormat || "shortDate");
  const end = formatDate(endDate, locale, options?.endFormat || "shortDate");
  return `${start} - ${end}`;
}
