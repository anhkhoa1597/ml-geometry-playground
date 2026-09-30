export function formatNumber(value: number, maximumFractionDigits = 3): string {
  const normalized = Object.is(value, -0) ? 0 : value;
  if (normalized !== 0 && Math.abs(normalized) < 0.001) return normalized.toExponential(2).replace('-', '−');
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    useGrouping: false,
  }).format(normalized).replace('-', '−');
}

export function formatSignedTerm(value: number): string {
  return value < 0 ? `(${formatNumber(value)})` : formatNumber(value);
}

export function formatAdditiveTerm(value: number, suffix = ''): string {
  return `${value < 0 ? '−' : '+'} ${formatNumber(Math.abs(value))}${suffix}`;
}
