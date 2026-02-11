export function normalizeTemperatureC(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return value;
}

export function normalizeWindMps(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return value;
}

export function normalizeVisibilityKm(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  // Open-Meteo visibility is meters. Store internally as km.
  return value / 1000;
}

export function normalizePercent(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return value;
}

export function normalizeDegree(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  const result = value % 360;
  return result < 0 ? result + 360 : result;
}

export function normalizeNonNegative(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }

  return value < 0 ? 0 : value;
}

export function normalizeSnowDepthCmFromMeters(value: unknown): number {
  return normalizeNonNegative(value) * 100;
}
