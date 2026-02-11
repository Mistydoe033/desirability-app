export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

export function extractCityName(label: string): string {
  return label.split(',')[0]?.trim() ?? label;
}

export function safeFixed(value: number, digits = 1): string {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.0';
}

export function msToKmh(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return Number((value * 3.6).toFixed(1));
}

export function metersToFeet(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return Number((value * 3.28084).toFixed(1));
}

export function normalizeDeg(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function compassDirection(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'N/A';
  }

  const labels = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const normalized = normalizeDeg(value);
  const index = Math.round(normalized / 22.5) % 16;
  return labels[index];
}

export function formatBearing(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'N/A';
  }

  const normalized = Math.round(normalizeDeg(value));
  return `${normalized}° (${compassDirection(normalized)})`;
}
