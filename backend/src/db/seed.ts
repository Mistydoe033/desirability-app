import { databaseClient } from './database';
import { cityRepository } from '../repositories/cityRepository';
import { CityFeatureProfile, CityRecord, FeatureCategoryName } from '../types/types';
import { logger } from '../utils/logger';
import { createEmptyFeatureProfile } from '../services/features/featureProfile';

interface SeedCity {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  elevationM: number;
}

interface SeedFeatureHint {
  selectedFeatures: FeatureCategoryName[];
  scores?: Partial<Record<FeatureCategoryName, number>>;
}

const SEED_CITIES: SeedCity[] = [
  { id: 'aspen-us', name: 'Aspen', country: 'United States', latitude: 39.1911, longitude: -106.8175, elevationM: 2438 },
  { id: 'zermatt-ch', name: 'Zermatt', country: 'Switzerland', latitude: 46.0207, longitude: 7.7491, elevationM: 1620 },
  { id: 'chamonix-fr', name: 'Chamonix', country: 'France', latitude: 45.9237, longitude: 6.8694, elevationM: 1035 },
  { id: 'banff-ca', name: 'Banff', country: 'Canada', latitude: 51.1784, longitude: -115.5708, elevationM: 1383 },
  { id: 'innsbruck-at', name: 'Innsbruck', country: 'Austria', latitude: 47.2692, longitude: 11.4041, elevationM: 574 },
  { id: 'whistler-ca', name: 'Whistler', country: 'Canada', latitude: 50.1163, longitude: -122.9574, elevationM: 668 },
  { id: 'stmoritz-ch', name: 'St. Moritz', country: 'Switzerland', latitude: 46.4908, longitude: 9.8355, elevationM: 1822 },
  { id: 'cortina-it', name: "Cortina d'Ampezzo", country: 'Italy', latitude: 46.5405, longitude: 12.1357, elevationM: 1224 },
  { id: 'niseko-jp', name: 'Niseko', country: 'Japan', latitude: 42.8048, longitude: 140.6874, elevationM: 175 },
  { id: 'vail-us', name: 'Vail', country: 'United States', latitude: 39.6403, longitude: -106.3742, elevationM: 2484 },

  { id: 'malibu-us', name: 'Malibu', country: 'United States', latitude: 34.0259, longitude: -118.7798, elevationM: 32 },
  { id: 'capetown-za', name: 'Cape Town', country: 'South Africa', latitude: -33.9249, longitude: 18.4241, elevationM: 25 },
  { id: 'goldcoast-au', name: 'Gold Coast', country: 'Australia', latitude: -28.0167, longitude: 153.4, elevationM: 5 },
  { id: 'byronbay-au', name: 'Byron Bay', country: 'Australia', latitude: -28.6474, longitude: 153.602, elevationM: 8 },
  { id: 'honolulu-us', name: 'Honolulu', country: 'United States', latitude: 21.3069, longitude: -157.8583, elevationM: 5 },
  { id: 'sandiego-us', name: 'San Diego', country: 'United States', latitude: 32.7157, longitude: -117.1611, elevationM: 20 },
  { id: 'lisbon-pt', name: 'Lisbon', country: 'Portugal', latitude: 38.7223, longitude: -9.1393, elevationM: 2 },
  { id: 'ericeira-pt', name: 'Ericeira', country: 'Portugal', latitude: 38.9667, longitude: -9.4167, elevationM: 12 },
  { id: 'biarritz-fr', name: 'Biarritz', country: 'France', latitude: 43.4832, longitude: -1.5586, elevationM: 6 },
  { id: 'santacruz-us', name: 'Santa Cruz', country: 'United States', latitude: 36.9741, longitude: -122.0308, elevationM: 10 },
  { id: 'denpasar-id', name: 'Denpasar', country: 'Indonesia', latitude: -8.65, longitude: 115.2167, elevationM: 7 },

  { id: 'interlaken-ch', name: 'Interlaken', country: 'Switzerland', latitude: 46.6863, longitude: 7.8632, elevationM: 568 },
  { id: 'boulder-us', name: 'Boulder', country: 'United States', latitude: 40.015, longitude: -105.2705, elevationM: 1624 },
  { id: 'queenstown-nz', name: 'Queenstown', country: 'New Zealand', latitude: -45.0312, longitude: 168.6626, elevationM: 310 },
  { id: 'moab-us', name: 'Moab', country: 'United States', latitude: 38.5733, longitude: -109.5498, elevationM: 1227 },
  { id: 'reykjavik-is', name: 'Reykjavik', country: 'Iceland', latitude: 64.1466, longitude: -21.9426, elevationM: 61 },
  { id: 'sedona-us', name: 'Sedona', country: 'United States', latitude: 34.8697, longitude: -111.7609, elevationM: 1326 },
  { id: 'cusco-pe', name: 'Cusco', country: 'Peru', latitude: -13.5319, longitude: -71.9675, elevationM: 3399 },
  { id: 'bergen-no', name: 'Bergen', country: 'Norway', latitude: 60.3913, longitude: 5.3221, elevationM: 12 },

  { id: 'london-uk', name: 'London', country: 'United Kingdom', latitude: 51.5072, longitude: -0.1276, elevationM: 11 },
  { id: 'paris-fr', name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, elevationM: 35 },
  { id: 'tokyo-jp', name: 'Tokyo', country: 'Japan', latitude: 35.6764, longitude: 139.65, elevationM: 40 },
  { id: 'newyork-us', name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006, elevationM: 10 },
  { id: 'rome-it', name: 'Rome', country: 'Italy', latitude: 41.9028, longitude: 12.4964, elevationM: 21 },
  { id: 'vienna-at', name: 'Vienna', country: 'Austria', latitude: 48.2082, longitude: 16.3738, elevationM: 171 },
  { id: 'berlin-de', name: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.405, elevationM: 34 },
  { id: 'madrid-es', name: 'Madrid', country: 'Spain', latitude: 40.4168, longitude: -3.7038, elevationM: 667 },
  { id: 'prague-cz', name: 'Prague', country: 'Czech Republic', latitude: 50.0755, longitude: 14.4378, elevationM: 200 },
  { id: 'seoul-kr', name: 'Seoul', country: 'South Korea', latitude: 37.5665, longitude: 126.978, elevationM: 38 },
  { id: 'istanbul-tr', name: 'Istanbul', country: 'Turkey', latitude: 41.0082, longitude: 28.9784, elevationM: 39 },
  { id: 'singapore-sg', name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, elevationM: 15 },
  { id: 'amsterdam-nl', name: 'Amsterdam', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041, elevationM: 2 },
  { id: 'kyoto-jp', name: 'Kyoto', country: 'Japan', latitude: 35.0116, longitude: 135.7681, elevationM: 50 },

  { id: 'barcelona-es', name: 'Barcelona', country: 'Spain', latitude: 41.3874, longitude: 2.1686, elevationM: 12 },
  { id: 'perth-au', name: 'Perth', country: 'Australia', latitude: -31.9523, longitude: 115.8613, elevationM: 14 },
  { id: 'santiago-cl', name: 'Santiago', country: 'Chile', latitude: -33.4489, longitude: -70.6693, elevationM: 570 },
  { id: 'vancouver-ca', name: 'Vancouver', country: 'Canada', latitude: 49.2827, longitude: -123.1207, elevationM: 70 }
];

const SEED_FEATURE_HINTS: Record<string, SeedFeatureHint> = {
  'aspen-us': { selectedFeatures: ['Skiing', 'Outdoor sightseeing'], scores: { Skiing: 86, 'Outdoor sightseeing': 66 } },
  'zermatt-ch': { selectedFeatures: ['Skiing', 'Outdoor sightseeing'], scores: { Skiing: 90, 'Outdoor sightseeing': 64 } },
  'chamonix-fr': { selectedFeatures: ['Skiing', 'Outdoor sightseeing'], scores: { Skiing: 88, 'Outdoor sightseeing': 67 } },
  'banff-ca': { selectedFeatures: ['Skiing', 'Outdoor sightseeing'], scores: { Skiing: 84, 'Outdoor sightseeing': 71 } },
  'innsbruck-at': { selectedFeatures: ['Skiing', 'Outdoor sightseeing'], scores: { Skiing: 88, 'Outdoor sightseeing': 72 } },
  'whistler-ca': { selectedFeatures: ['Skiing', 'Outdoor sightseeing'], scores: { Skiing: 89, 'Outdoor sightseeing': 74 } },
  'stmoritz-ch': { selectedFeatures: ['Skiing', 'Outdoor sightseeing'], scores: { Skiing: 91, 'Outdoor sightseeing': 68 } },
  'cortina-it': { selectedFeatures: ['Skiing', 'Outdoor sightseeing'], scores: { Skiing: 87, 'Outdoor sightseeing': 70 } },
  'niseko-jp': { selectedFeatures: ['Skiing'], scores: { Skiing: 85 } },
  'vail-us': { selectedFeatures: ['Skiing'], scores: { Skiing: 86 } },
  'malibu-us': { selectedFeatures: ['Surfing', 'Outdoor sightseeing'], scores: { Surfing: 82, 'Outdoor sightseeing': 72 } },
  'capetown-za': { selectedFeatures: ['Surfing', 'Outdoor sightseeing'], scores: { Surfing: 84, 'Outdoor sightseeing': 68 } },
  'goldcoast-au': { selectedFeatures: ['Surfing', 'Outdoor sightseeing'], scores: { Surfing: 88, 'Outdoor sightseeing': 70 } },
  'byronbay-au': { selectedFeatures: ['Surfing', 'Outdoor sightseeing'], scores: { Surfing: 86, 'Outdoor sightseeing': 72 } },
  'honolulu-us': { selectedFeatures: ['Surfing', 'Outdoor sightseeing'], scores: { Surfing: 83, 'Outdoor sightseeing': 73 } },
  'sandiego-us': { selectedFeatures: ['Surfing', 'Outdoor sightseeing'], scores: { Surfing: 79, 'Outdoor sightseeing': 74 } },
  'lisbon-pt': { selectedFeatures: ['Surfing', 'Outdoor sightseeing', 'Indoor sightseeing'], scores: { Surfing: 78, 'Outdoor sightseeing': 69, 'Indoor sightseeing': 66 } },
  'ericeira-pt': { selectedFeatures: ['Surfing', 'Outdoor sightseeing'], scores: { Surfing: 81, 'Outdoor sightseeing': 66 } },
  'biarritz-fr': { selectedFeatures: ['Surfing', 'Outdoor sightseeing'], scores: { Surfing: 80, 'Outdoor sightseeing': 67 } },
  'santacruz-us': { selectedFeatures: ['Surfing', 'Outdoor sightseeing'], scores: { Surfing: 82, 'Outdoor sightseeing': 70 } },
  'denpasar-id': { selectedFeatures: ['Surfing', 'Outdoor sightseeing'], scores: { Surfing: 84, 'Outdoor sightseeing': 68 } },
  'interlaken-ch': { selectedFeatures: ['Outdoor sightseeing'], scores: { 'Outdoor sightseeing': 76 } },
  'boulder-us': { selectedFeatures: ['Outdoor sightseeing', 'Skiing'], scores: { 'Outdoor sightseeing': 77, Skiing: 63 } },
  'queenstown-nz': { selectedFeatures: ['Outdoor sightseeing'], scores: { 'Outdoor sightseeing': 78 } },
  'moab-us': { selectedFeatures: ['Outdoor sightseeing'], scores: { 'Outdoor sightseeing': 75 } },
  'reykjavik-is': { selectedFeatures: ['Outdoor sightseeing', 'Indoor sightseeing'], scores: { 'Outdoor sightseeing': 79, 'Indoor sightseeing': 64 } },
  'sedona-us': { selectedFeatures: ['Outdoor sightseeing'], scores: { 'Outdoor sightseeing': 80 } },
  'cusco-pe': { selectedFeatures: ['Outdoor sightseeing'], scores: { 'Outdoor sightseeing': 78 } },
  'bergen-no': { selectedFeatures: ['Outdoor sightseeing', 'Indoor sightseeing'], scores: { 'Outdoor sightseeing': 70, 'Indoor sightseeing': 62 } },
  'london-uk': { selectedFeatures: ['Indoor sightseeing'], scores: { 'Indoor sightseeing': 79 } },
  'paris-fr': { selectedFeatures: ['Indoor sightseeing'], scores: { 'Indoor sightseeing': 82 } },
  'tokyo-jp': { selectedFeatures: ['Indoor sightseeing'], scores: { 'Indoor sightseeing': 83 } },
  'newyork-us': { selectedFeatures: ['Indoor sightseeing'], scores: { 'Indoor sightseeing': 84 } },
  'rome-it': { selectedFeatures: ['Indoor sightseeing', 'Outdoor sightseeing'], scores: { 'Indoor sightseeing': 85, 'Outdoor sightseeing': 68 } },
  'vienna-at': { selectedFeatures: ['Indoor sightseeing'], scores: { 'Indoor sightseeing': 80 } },
  'berlin-de': { selectedFeatures: ['Indoor sightseeing'], scores: { 'Indoor sightseeing': 78 } },
  'madrid-es': { selectedFeatures: ['Indoor sightseeing', 'Outdoor sightseeing'], scores: { 'Indoor sightseeing': 76, 'Outdoor sightseeing': 69 } },
  'prague-cz': { selectedFeatures: ['Indoor sightseeing'], scores: { 'Indoor sightseeing': 79 } },
  'seoul-kr': { selectedFeatures: ['Indoor sightseeing'], scores: { 'Indoor sightseeing': 80 } },
  'istanbul-tr': { selectedFeatures: ['Indoor sightseeing', 'Outdoor sightseeing'], scores: { 'Indoor sightseeing': 77, 'Outdoor sightseeing': 67 } },
  'singapore-sg': { selectedFeatures: ['Indoor sightseeing'], scores: { 'Indoor sightseeing': 78 } },
  'amsterdam-nl': { selectedFeatures: ['Indoor sightseeing'], scores: { 'Indoor sightseeing': 79 } },
  'kyoto-jp': { selectedFeatures: ['Indoor sightseeing', 'Outdoor sightseeing'], scores: { 'Indoor sightseeing': 81, 'Outdoor sightseeing': 68 } },
  'barcelona-es': { selectedFeatures: ['Outdoor sightseeing', 'Indoor sightseeing'], scores: { 'Outdoor sightseeing': 73, 'Indoor sightseeing': 67 } },
  'perth-au': { selectedFeatures: ['Surfing', 'Outdoor sightseeing'], scores: { Surfing: 77, 'Outdoor sightseeing': 71 } },
  'santiago-cl': { selectedFeatures: ['Outdoor sightseeing'], scores: { 'Outdoor sightseeing': 70 } },
  'vancouver-ca': { selectedFeatures: ['Outdoor sightseeing', 'Indoor sightseeing'], scores: { 'Outdoor sightseeing': 74, 'Indoor sightseeing': 66 } }
};

function createSeedFeatureProfile(seed: SeedCity): CityFeatureProfile {
  const profile = createEmptyFeatureProfile();
  const hint = SEED_FEATURE_HINTS[seed.id];

  profile.computed_at = new Date().toISOString();
  profile.algorithm_version = 'seed-v1.0.0';

  if (!hint) {
    return profile;
  }

  profile.selectedFeatures = [...hint.selectedFeatures];

  const defaultSelectedScore = 65;
  const defaultNonSelectedScore = 35;

  const allFeatures: FeatureCategoryName[] = [
    'Skiing',
    'Surfing',
    'Outdoor sightseeing',
    'Indoor sightseeing'
  ];

  allFeatures.forEach((feature) => {
    const selected = hint.selectedFeatures.includes(feature);
    profile.scoresByFeature[feature] = hint.scores?.[feature] ?? (selected ? defaultSelectedScore : defaultNonSelectedScore);
    profile.evidence[feature] = {
      signals: {
        seed_city_id: seed.id,
        seed_selected: selected
      },
      thresholds: {
        source: 'seed-bootstrap'
      },
      gates: {
        curated_seed_gate: selected
      },
      notes: selected
        ? ['Curated bootstrap assignment; precompute will overwrite with live-derived profile.']
        : []
    };
  });

  return profile;
}

function toCityRecord(seed: SeedCity): CityRecord {
  return {
    ...seed,
    features: createSeedFeatureProfile(seed),
    isCandidate: true
  };
}

export function seedDatabase(): void {
  databaseClient.initialize();

  const existingCities = cityRepository.listAll();
  const existingIds = new Set(existingCities.map((city) => city.id));
  const missingSeedRecords = SEED_CITIES
    .filter((seed) => !existingIds.has(seed.id))
    .map(toCityRecord);

  if (missingSeedRecords.length > 0) {
    cityRepository.upsertCities(missingSeedRecords);
    logger.info('Seed', 'Inserted missing seed cities', {
      inserted: missingSeedRecords.length,
      totalSeedCities: SEED_CITIES.length,
      existingBeforeInsert: existingCities.length
    });
  } else {
    logger.info('Seed', 'No missing seed cities', {
      count: existingCities.length,
      seedCatalog: SEED_CITIES.length
    });
  }

  cityRepository.normalizeFeaturePayloads();
}

if (require.main === module) {
  try {
    seedDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('Seed', 'Failed to seed database', error);
    process.exit(1);
  }
}
