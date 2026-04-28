function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function resolveDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const resolvedDate = value instanceof Date ? value : new Date(value);
  return Number.isNaN(resolvedDate.getTime()) ? null : resolvedDate;
}

function parseDateTimeLocalValue(value: string): Date | null {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!match) {
    return null;
  }

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue, secondValue] =
    match;
  const year = Number(yearValue);
  const month = Number(monthValue) - 1;
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = secondValue ? Number(secondValue) : 0;
  const date = new Date(year, month, day, hour, minute, second);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    return null;
  }

  return date;
}

export function toDateTimeLocalInputValue(
  value: string | Date | null | undefined
): string {
  const date = resolveDate(value);
  if (!date) {
    return "";
  }

  const datePart = [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate()),
  ].join("-");
  return `${datePart}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function dateTimeLocalInputValueToUtcIso(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = parseDateTimeLocalValue(value);
  return date ? date.toISOString() : null;
}
