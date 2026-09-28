export function formatMoney(
  cents: number,
  currency: string,
  locale = "en-US",
) {
  if (!Number.isSafeInteger(cents)) {
    throw new TypeError("Money must be represented as integer cents.");
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatPriceAdjustment(cents: number, currency: string) {
  if (cents === 0) {
    return "Included";
  }

  const sign = cents > 0 ? "+" : "−";
  return `${sign}${formatMoney(Math.abs(cents), currency)}`;
}
