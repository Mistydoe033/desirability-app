export function normalizeDeg(value: number): number {
  const result = value % 360;
  return result < 0 ? result + 360 : result;
}

export function angularDiffDeg(a: number, b: number): number {
  const diff = Math.abs(normalizeDeg(a) - normalizeDeg(b));
  return diff > 180 ? 360 - diff : diff;
}

export function oppositeDeg(value: number): number {
  return normalizeDeg(value + 180);
}

export function bearingDeg(fromLat: number, fromLon: number, toLat: number, toLon: number): number {
  const phi1 = (fromLat * Math.PI) / 180;
  const phi2 = (toLat * Math.PI) / 180;
  const deltaLon = ((toLon - fromLon) * Math.PI) / 180;

  const y = Math.sin(deltaLon) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLon);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return normalizeDeg(bearing);
}

export function haversineKm(fromLat: number, fromLon: number, toLat: number, toLon: number): number {
  const toRad = (degrees: number): number => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const deltaLat = toRad(toLat - fromLat);
  const deltaLon = toRad(toLon - fromLon);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRad(fromLat)) *
      Math.cos(toRad(toLat)) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}
