import type { DashboardPeriodKey } from "./types";

export interface DateRange {
  start: Date;
  end: Date;
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function resolvePeriodRange(period: DashboardPeriodKey, reference = new Date()): DateRange {
  const now = new Date(reference);
  const end = endOfDay(now);

  switch (period) {
    case "today": {
      return { start: startOfDay(now), end };
    }
    case "7d": {
      const start = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
      return { start, end };
    }
    case "30d": {
      const start = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
      return { start, end };
    }
    case "currentMonth":
    default: {
      const monthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      return { start: monthStart, end };
    }
  }
}

export function getComparisonRange(range: DateRange): DateRange {
  const duration = range.end.getTime() - range.start.getTime();
  const comparisonEnd = new Date(range.start.getTime() - 1);
  const comparisonStart = new Date(comparisonEnd.getTime() - duration);
  return { start: startOfDay(comparisonStart), end: endOfDay(comparisonEnd) };
}

export function parseDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function isWithinRange(value: string | Date, range: DateRange) {
  const date = parseDate(value);
  return date.getTime() >= range.start.getTime() && date.getTime() <= range.end.getTime();
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function safeDivide(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 0;
  }
  return numerator / denominator;
}

export function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatPercent(value: number, locale: string, fractionDigits = 1) {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatCurrency(value: number, locale: string, currency = "BRL") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function computeDelta(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 1;
  }

  return (current - previous) / previous;
}

export function differenceInHours(later: string | Date, earlier: string | Date) {
  const laterDate = parseDate(later);
  const earlierDate = parseDate(earlier);
  const diffMs = laterDate.getTime() - earlierDate.getTime();
  return diffMs / (1000 * 60 * 60);
}

export function formatDateTimeLocalInput(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export function toIsoStringFromLocalInput(value: string) {
  return new Date(value).toISOString();
}
