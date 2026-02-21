export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
];

const CURRENCY_LOCALE_MAP: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  CAD: "en-CA",
  AUD: "en-AU",
  SGD: "en-SG",
};

/**
 * Format a number as currency
 */
export function formatCurrency(
  value: number,
  options: { compact?: boolean; currency?: string } = {}
): string {
  const currency = options.currency ?? "INR";
  const locale = CURRENCY_LOCALE_MAP[currency] ?? "en-IN";
  const isJPY = currency === "JPY";

  if (options.compact && Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: isJPY ? 0 : 2,
    maximumFractionDigits: isJPY ? 0 : 2,
  }).format(value);
}

/**
 * Format a percentage change
 */
export function formatPercent(value: number): string {
  const formatted = Math.abs(value).toFixed(1);
  return `${value >= 0 ? "+" : "-"}${formatted}%`;
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Format a date for snapshot labels (short)
 */
export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  }).format(new Date(date));
}

/**
 * Calculate the percentage change between two values
 */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Clamp a CSS color to a valid hex or return a fallback
 */
export function safeColor(color: string | null | undefined, fallback = "#0d9488"): string {
  if (!color) return fallback;
  return color;
}

/**
 * Generate a warm color from an index for auto-coloring categories
 */
const WARM_COLORS = [
  "#0d9488", // teal
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#10b981", // emerald
  "#f97316", // orange
  "#3b82f6", // blue
  "#ef4444", // red
  "#84cc16", // lime
  "#6366f1", // indigo
];

export function autoColor(index: number): string {
  return WARM_COLORS[index % WARM_COLORS.length];
}

/**
 * Parse a Prisma Decimal to a plain JS number
 */
export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return 0;
}

/**
 * Combine class names (simple utility)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
