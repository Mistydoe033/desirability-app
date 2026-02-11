import { FEATURE_ALGORITHM, FEATURE_CATEGORIES } from '../../constants/constants';
import { CityFeatureProfile, FeatureCategoryName, FeatureEvidenceEntry } from '../../types/types';

const FEATURE_LIST = [...FEATURE_CATEGORIES] as FeatureCategoryName[];

function emptyEvidence(): FeatureEvidenceEntry {
  return {
    signals: {},
    thresholds: {},
    gates: {},
    notes: []
  };
}

export function createEmptyFeatureProfile(): CityFeatureProfile {
  return {
    selectedFeatures: [],
    scoresByFeature: {
      Skiing: 0,
      Surfing: 0,
      'Outdoor sightseeing': 0,
      'Indoor sightseeing': 0
    },
    evidence: {
      Skiing: emptyEvidence(),
      Surfing: emptyEvidence(),
      'Outdoor sightseeing': emptyEvidence(),
      'Indoor sightseeing': emptyEvidence()
    },
    computed_at: new Date(0).toISOString(),
    algorithm_version: FEATURE_ALGORITHM.VERSION
  };
}

export function isFeatureActivity(value: unknown): value is FeatureCategoryName {
  return typeof value === 'string' && FEATURE_LIST.includes(value as FeatureCategoryName);
}

export const isActivity = isFeatureActivity;

function clampScore(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
}

function sanitizeSelectedFeatures(input: unknown): FeatureCategoryName[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized = input.filter(isFeatureActivity);
  return Array.from(new Set(normalized));
}

function deriveSelectedFeatures(scores: Record<FeatureCategoryName, number>): FeatureCategoryName[] {
  return FEATURE_LIST.filter((feature) => scores[feature] >= FEATURE_ALGORITHM.MIN_ASSIGNMENT_SCORE);
}

function sanitizeScoresByFeature(input: unknown): Record<FeatureCategoryName, number> {
  const result = createEmptyFeatureProfile().scoresByFeature;
  if (!input || typeof input !== 'object') {
    return result;
  }

  FEATURE_LIST.forEach((feature) => {
    result[feature] = clampScore((input as Record<string, unknown>)[feature]);
  });

  return result;
}

function sanitizeEvidence(input: unknown): Record<FeatureCategoryName, FeatureEvidenceEntry> {
  const result = createEmptyFeatureProfile().evidence;
  if (!input || typeof input !== 'object') {
    return result;
  }

  FEATURE_LIST.forEach((feature) => {
    const raw = (input as Record<string, unknown>)[feature];
    if (!raw || typeof raw !== 'object') {
      return;
    }

    const candidate = raw as Partial<FeatureEvidenceEntry>;
    result[feature] = {
      signals: candidate.signals && typeof candidate.signals === 'object'
        ? (candidate.signals as Record<string, number | string | boolean | null>)
        : {},
      thresholds: candidate.thresholds && typeof candidate.thresholds === 'object'
        ? (candidate.thresholds as Record<string, number | string | boolean>)
        : {},
      gates: candidate.gates && typeof candidate.gates === 'object'
        ? (candidate.gates as Record<string, boolean>)
        : {},
      notes: Array.isArray(candidate.notes)
        ? candidate.notes.filter((note): note is string => typeof note === 'string')
        : []
    };
  });

  return result;
}

export function sanitizeCityFeatureProfile(input: unknown): CityFeatureProfile {
  const empty = createEmptyFeatureProfile();
  if (!input || typeof input !== 'object') {
    return empty;
  }

  const candidate = input as Partial<CityFeatureProfile>;
  const scoresByFeature = sanitizeScoresByFeature(candidate.scoresByFeature);
  const explicitSelected = sanitizeSelectedFeatures(candidate.selectedFeatures);
  const evidence = sanitizeEvidence(candidate.evidence);

  explicitSelected.forEach((feature) => {
    if (scoresByFeature[feature] <= 0) {
      scoresByFeature[feature] = FEATURE_ALGORITHM.MIN_ASSIGNMENT_SCORE;
    }
  });

  const selectedFeatures = deriveSelectedFeatures(scoresByFeature);

  const computedAt = typeof candidate.computed_at === 'string' && candidate.computed_at.trim().length > 0
    ? candidate.computed_at
    : empty.computed_at;

  const algorithmVersion = typeof candidate.algorithm_version === 'string' && candidate.algorithm_version.trim().length > 0
    ? candidate.algorithm_version
    : empty.algorithm_version;

  return {
    selectedFeatures,
    scoresByFeature,
    evidence,
    computed_at: computedAt,
    algorithm_version: algorithmVersion
  };
}

export function parseCityFeatureProfile(raw: string): CityFeatureProfile {
  if (!raw || raw.trim().length === 0) {
    return createEmptyFeatureProfile();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (Array.isArray(parsed)) {
      return sanitizeCityFeatureProfile({
        selectedFeatures: parsed.filter(isFeatureActivity),
        scoresByFeature: {},
        evidence: {},
        computed_at: new Date().toISOString(),
        algorithm_version: `${FEATURE_ALGORITHM.VERSION}-array-normalized`
      });
    }

    return sanitizeCityFeatureProfile(parsed);
  } catch {
    return createEmptyFeatureProfile();
  }
}
