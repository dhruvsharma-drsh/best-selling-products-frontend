interface CurrencyDisplayInfo {
  code?: string;
  symbol?: string;
  locale?: string;
}

export function formatCurrencyAmount(
  amount: number | null | undefined,
  currency?: CurrencyDisplayInfo,
  fallback: CurrencyDisplayInfo = { code: "USD", symbol: "$", locale: "en-US" }
): string {
  if (amount == null || !Number.isFinite(amount)) {
    return "—";
  }

  const currencyCode = currency?.code || fallback.code || "USD";
  const locale = currency?.locale || fallback.locale || "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "narrowSymbol",
    }).format(amount);
  } catch {
    const symbol = currency?.symbol || fallback.symbol || currencyCode;
    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export function formatUsdAmount(amount: number | null | undefined): string {
  return formatCurrencyAmount(amount, {
    code: "USD",
    symbol: "$",
    locale: "en-US",
  });
}
