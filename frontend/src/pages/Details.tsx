import { useLazyQuery, useQuery } from '@apollo/client';
import {
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
  Button
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CITY_FEATURES_QUERY,
  CITY_POI_SUMMARY_QUERY,
  MARINE_DATA_QUERY,
  RANK_BY_COORDINATES_QUERY,
  RANK_QUERY,
  SURF_SPOT_SCORE_QUERY
} from '../api';
import { ErrorState, LoadingState } from '../components';
import { SurfSpotPanel } from '../features/surf';
import { useDebouncedValue, useLatestRequestGuard } from '../hooks';
import {
  ActivityName,
  ActivityResult,
  CityFeaturesQueryData,
  CityFeaturesQueryVariables,
  CityPoiSummaryQueryData,
  CityPoiSummaryQueryVariables,
  Coordinates,
  MarineDataQueryData,
  MarineDataQueryVariables,
  RankByCoordinatesQueryData,
  RankByCoordinatesQueryVariables,
  RankQueryData,
  RankQueryVariables,
  SurfSpotScoreQueryData,
  SurfSpotScoreQueryVariables
} from '../types';
import { formatBearing, formatDate, metersToFeet, msToKmh, normalizeDeg, safeFixed } from '../utils/format';

function isActivityName(value: string | null): value is ActivityName {
  return (
    value === 'Skiing' ||
    value === 'Surfing' ||
    value === 'Outdoor sightseeing' ||
    value === 'Indoor sightseeing'
  );
}

function angularDiffDeg(a: number, b: number): number {
  const diff = Math.abs(normalizeDeg(a) - normalizeDeg(b));
  return diff > 180 ? 360 - diff : diff;
}

function describeWindRelativeToCoast(windFromDeg: number | null, coastFaceDeg: number | null): string {
  if (windFromDeg === null || coastFaceDeg === null) {
    return 'Coast/wind alignment unavailable.';
  }

  const offshoreBearing = normalizeDeg(coastFaceDeg + 180);
  const offshoreDiff = angularDiffDeg(windFromDeg, offshoreBearing);
  const onshoreDiff = angularDiffDeg(windFromDeg, coastFaceDeg);

  if (onshoreDiff <= 25) {
    return `Onshore tendency (${Math.round(onshoreDiff)}° from onshore axis).`;
  }

  if (offshoreDiff <= 35) {
    return `Offshore-friendly wind (${Math.round(offshoreDiff)}° from offshore axis).`;
  }

  return `Cross-shore wind (${Math.round(offshoreDiff)}° from offshore axis).`;
}

function toNumeric(value: string | number): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatSurfFactorInline(factor: { name: string; value: string | number }): { label: string; value: string } {
  const numeric = toNumeric(factor.value);
  const label = factor.name.replace(/\s*\([^)]*\)\s*$/, '');

  if (label === 'Swell height' && numeric !== null) {
    const feet = metersToFeet(numeric);
    return {
      label,
      value: `${safeFixed(numeric)} m${feet !== null ? ` / ${safeFixed(feet)} ft` : ''}`
    };
  }

  if (label === 'Wave height' && numeric !== null) {
    const feet = metersToFeet(numeric);
    return {
      label,
      value: `${safeFixed(numeric)} m${feet !== null ? ` / ${safeFixed(feet)} ft` : ''}`
    };
  }

  if (label === 'Swell period' && numeric !== null) {
    return {
      label,
      value: `${safeFixed(numeric)} s`
    };
  }

  if (label === 'Water temperature' && numeric !== null) {
    return {
      label,
      value: `${safeFixed(numeric)} C`
    };
  }

  if (label === 'Wind quality' && numeric !== null) {
    return {
      label,
      value: `${safeFixed(numeric)} / 100`
    };
  }

  return {
    label,
    value: String(factor.value)
  };
}

function findFactorValue(factors: Array<{ name: string; value: string | number }>, labelPrefix: string): number | null {
  const factor = factors.find((item) => item.name.toLowerCase().startsWith(labelPrefix.toLowerCase()));
  if (!factor) {
    return null;
  }
  return toNumeric(factor.value);
}

export function DetailsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activityOptions: ActivityName[] = ['Skiing', 'Surfing', 'Outdoor sightseeing', 'Indoor sightseeing'];
  const city = searchParams.get('city');
  const activityParam = searchParams.get('activity');
  const profileScoreParam = searchParams.get('profileScore');
  const returnTo = searchParams.get('returnTo');

  const activity: ActivityName = isActivityName(activityParam) ? activityParam : 'Skiing';

  const {
    data: rankData,
    loading: rankLoading,
    error: rankError
  } = useQuery<RankQueryData, RankQueryVariables>(RANK_QUERY, {
    variables: city ? { city } : undefined,
    skip: !city,
    fetchPolicy: 'cache-first'
  });

  const selectedActivity = useMemo<ActivityResult | null>(() => {
    if (!rankData || !activity) {
      return null;
    }

    return rankData.rank.activities.find((item) => item.activity === activity) ?? null;
  }, [rankData, activity]);

  const {
    data: cityFeaturesData,
    loading: cityFeaturesLoading,
    error: cityFeaturesError
  } = useQuery<CityFeaturesQueryData, CityFeaturesQueryVariables>(CITY_FEATURES_QUERY, {
    variables: city ? { city } : undefined,
    skip: !city,
    fetchPolicy: 'cache-first'
  });

  const {
    data: cityPoiData,
    loading: cityPoiLoading,
    error: cityPoiError
  } = useQuery<CityPoiSummaryQueryData, CityPoiSummaryQueryVariables>(CITY_POI_SUMMARY_QUERY, {
    variables: city ? { city } : undefined,
    skip: !city || activity !== 'Indoor sightseeing',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first'
  });

  const {
    data: cityMarineData,
    loading: cityMarineLoading,
    error: cityMarineError
  } = useQuery<MarineDataQueryData, MarineDataQueryVariables>(MARINE_DATA_QUERY, {
    variables: rankData
      ? {
          latitude: rankData.rank.latitude,
          longitude: rankData.rank.longitude
        }
      : undefined,
    skip: !rankData || activity !== 'Surfing',
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first'
  });

  const [selectedSpot, setSelectedSpot] = useState<Coordinates | null>(null);
  const [showSurfSpotTools, setShowSurfSpotTools] = useState(false);
  const debouncedSpot = useDebouncedValue(selectedSpot, 250);

  const [spotMarineData, setSpotMarineData] = useState<MarineDataQueryData['marineData'] | null>(null);
  const [spotScore, setSpotScore] = useState<SurfSpotScoreQueryData['surfSpotScore'] | null>(null);
  const [spotRankData, setSpotRankData] = useState<RankByCoordinatesQueryData['rankByCoordinates'] | null>(null);
  const [spotLoading, setSpotLoading] = useState(false);
  const [spotError, setSpotError] = useState<string | null>(null);

  const requestGuard = useLatestRequestGuard();

  const [fetchMarineData] = useLazyQuery<MarineDataQueryData, MarineDataQueryVariables>(MARINE_DATA_QUERY, {
    fetchPolicy: 'network-only'
  });

  const [fetchSurfSpotScore] = useLazyQuery<SurfSpotScoreQueryData, SurfSpotScoreQueryVariables>(
    SURF_SPOT_SCORE_QUERY,
    {
      fetchPolicy: 'network-only'
    }
  );
  const [fetchRankByCoordinates] = useLazyQuery<RankByCoordinatesQueryData, RankByCoordinatesQueryVariables>(
    RANK_BY_COORDINATES_QUERY,
    {
      fetchPolicy: 'network-only'
    }
  );

  useEffect(() => {
    if (activity !== 'Surfing' || !debouncedSpot || !city) {
      return;
    }

    const requestId = requestGuard.startRequest();
    setSpotLoading(true);
    setSpotError(null);
    setSpotMarineData(null);
    setSpotScore(null);
    setSpotRankData(null);

    Promise.allSettled([
      fetchMarineData({
        variables: {
          latitude: debouncedSpot.latitude,
          longitude: debouncedSpot.longitude
        }
      }),
      fetchSurfSpotScore({
        variables: {
          coordinates: debouncedSpot,
          locationName: city
        }
      }),
      fetchRankByCoordinates({
        variables: {
          coordinates: debouncedSpot,
          locationName: city
        }
      })
    ])
      .then((results) => {
        if (!requestGuard.isLatest(requestId)) {
          return;
        }

        const [marineResult, spotScoreResult, rankByCoordinatesResult] = results;
        const rankByCoordinatesData =
          rankByCoordinatesResult.status === 'fulfilled'
            ? rankByCoordinatesResult.value.data?.rankByCoordinates ?? null
            : null;
        const surfingFromRankByCoordinates =
          rankByCoordinatesData?.activities.find((item) => item.activity === 'Surfing') ?? null;

        if (marineResult.status === 'fulfilled') {
          setSpotMarineData(marineResult.value.data?.marineData ?? null);
        }

        if (spotScoreResult.status === 'fulfilled') {
          setSpotScore(spotScoreResult.value.data?.surfSpotScore ?? surfingFromRankByCoordinates);
        } else {
          setSpotScore(surfingFromRankByCoordinates);
        }

        setSpotRankData(rankByCoordinatesData);

        const failedRequests = results.filter((result) => result.status === 'rejected').length;
        if (failedRequests > 0) {
          setSpotError(
            failedRequests === results.length
              ? 'Unable to load spot diagnostics for selected coordinates.'
              : 'Some spot diagnostics are unavailable for selected coordinates.'
          );
        }
      })
      .finally(() => {
        if (!requestGuard.isLatest(requestId)) {
          return;
        }

        setSpotLoading(false);
      });
  }, [activity, city, debouncedSpot, fetchMarineData, fetchSurfSpotScore, fetchRankByCoordinates, requestGuard]);

  const surfMarine = cityMarineData?.marineData;
  const marineDailyByDate = useMemo(() => {
    const byDate = new Map<string, { swellHeightM: number | null; waveHeightM: number | null; swellPeriodS: number | null }>();
    if (activity !== 'Surfing' || !surfMarine) {
      return byDate;
    }

    const buckets = new Map<string, { swellHeightSum: number; waveHeightSum: number; periodSum: number; swellCount: number; waveCount: number; periodCount: number }>();
    surfMarine.hourly.time.forEach((time, index) => {
      const date = time.slice(0, 10);
      const bucket = buckets.get(date) ?? {
        swellHeightSum: 0,
        waveHeightSum: 0,
        periodSum: 0,
        swellCount: 0,
        waveCount: 0,
        periodCount: 0
      };

      const swellHeight = surfMarine.hourly.swellWaveHeightM[index];
      const waveHeight = surfMarine.hourly.waveHeightM[index];
      const swellPeriod = surfMarine.hourly.swellWavePeriodS[index];

      if (Number.isFinite(swellHeight)) {
        bucket.swellHeightSum += swellHeight;
        bucket.swellCount += 1;
      }
      if (Number.isFinite(waveHeight)) {
        bucket.waveHeightSum += waveHeight;
        bucket.waveCount += 1;
      }
      if (Number.isFinite(swellPeriod)) {
        bucket.periodSum += swellPeriod;
        bucket.periodCount += 1;
      }

      buckets.set(date, bucket);
    });

    buckets.forEach((bucket, date) => {
      byDate.set(date, {
        swellHeightM: bucket.swellCount > 0 ? bucket.swellHeightSum / bucket.swellCount : null,
        waveHeightM: bucket.waveCount > 0 ? bucket.waveHeightSum / bucket.waveCount : null,
        swellPeriodS: bucket.periodCount > 0 ? bucket.periodSum / bucket.periodCount : null
      });
    });

    return byDate;
  }, [activity, surfMarine]);

  if (!city) {
    return <ErrorState message="Missing city or activity in URL. Open details from Search or Browse." />;
  }

  if (rankLoading) {
    return <LoadingState label="Loading activity details..." />;
  }

  if (rankError) {
    return <ErrorState message={rankError.message} />;
  }

  if (!rankData || !selectedActivity) {
    return <ErrorState message="No details available for the selected activity." />;
  }

  const firstForecastDay = rankData.rank.forecast[0];
  const avgSnowDepth = rankData.rank.forecast.length > 0
    ? rankData.rank.forecast.reduce((sum, day) => sum + day.snowDepthCm, 0) / rankData.rank.forecast.length
    : 0;
  const avgVisibility = rankData.rank.forecast.length > 0
    ? rankData.rank.forecast.reduce((sum, day) => sum + (day.visibilityKm ?? 0), 0) / rankData.rank.forecast.length
    : 0;
  const dryDayCount = rankData.rank.forecast.filter((day) => day.precipitationMm < 1).length;
  const forecastByDate = new Map(rankData.rank.forecast.map((day) => [day.date, day]));
  const skiingSignals = cityFeaturesData?.cityFeatures.features.evidence?.Skiing?.signals;
  const yearlySnowfallFromSignals = typeof skiingSignals?.annual_snowfall_cm === 'number'
    ? skiingSignals.annual_snowfall_cm
    : null;
  const yearlySnowfallEstimateCm = yearlySnowfallFromSignals ??
    Number((rankData.rank.forecast.reduce((sum, day) => sum + day.snowfallCm, 0) * 52).toFixed(1));

  const firstSwellDirection = surfMarine?.hourly.swellWaveDirectionDeg[0];
  const firstSwellPeriod = surfMarine?.hourly.swellWavePeriodS[0];
  const firstSwellHeight = surfMarine?.hourly.swellWaveHeightM[0];
  const firstSwellHeightFt = metersToFeet(firstSwellHeight ?? null);
  const firstWaveHeight = surfMarine?.hourly.waveHeightM[0];
  const firstWaveHeightFt = metersToFeet(firstWaveHeight ?? null);
  const coastFaceDeg = rankData.rank.coast?.faceDeg ?? null;
  const windSummary = describeWindRelativeToCoast(firstForecastDay?.windFromDeg ?? null, coastFaceDeg);
  const firstWindKmh = msToKmh(firstForecastDay?.windSpeedMps ?? null);
  const profileScoreFromBrowse = profileScoreParam !== null ? Number(profileScoreParam) : Number.NaN;
  const activityProfileScore = cityFeaturesData?.cityFeatures.features.scoresByFeature?.[activity];
  const effectiveActivityProfileScore = Number.isFinite(profileScoreFromBrowse)
    ? profileScoreFromBrowse
    : (typeof activityProfileScore === 'number' ? activityProfileScore : Number.NaN);
  const hasActivityProfileScore = Number.isFinite(effectiveActivityProfileScore);

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <div>
          <Typography variant="h4" sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>
            {activity} in {rankData.rank.location}
          </Typography>
          {hasActivityProfileScore && (
            <Typography color="text.secondary">
              Profile score {safeFixed(effectiveActivityProfileScore)} (Browse ranking)
            </Typography>
          )}
          <Typography color="text.secondary">
            Weekly forecast score {safeFixed(selectedActivity.week.score0to100)} ({selectedActivity.week.rating})
          </Typography>
        </div>
        <Button
          variant="outlined"
          onClick={() => {
            if (returnTo && returnTo.startsWith('/')) {
              navigate(returnTo);
              return;
            }

            navigate(-1);
          }}
        >
          Back
        </Button>
      </Stack>

      <Tabs
        value={activityOptions.indexOf(activity)}
        onChange={(_, nextIndex: number) => {
          const nextActivity = activityOptions[nextIndex];
          if (!nextActivity) {
            return;
          }

          const nextParams = new URLSearchParams(searchParams);
          nextParams.set('activity', nextActivity);
          nextParams.delete('profileScore');
          setSearchParams(nextParams, { replace: true });
        }}
      >
        {activityOptions.map((option) => (
          <Tab key={option} label={option} />
        ))}
      </Tabs>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            Activity snapshot
          </Typography>
          {activity === 'Skiing' && (
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">Average snow depth</Typography>
                <Typography variant="body2" color="text.secondary">{safeFixed(avgSnowDepth)} cm</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">Fresh snowfall (today)</Typography>
                <Typography variant="body2" color="text.secondary">
                  {safeFixed(firstForecastDay?.snowfallCm ?? 0)} cm
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">Wind (today)</Typography>
                <Typography variant="body2" color="text.secondary">
                  {safeFixed(firstWindKmh ?? 0)} km/h
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2">Yearly snowfall (estimate)</Typography>
                <Typography variant="body2" color="text.secondary">
                  {safeFixed(yearlySnowfallEstimateCm)} cm
                </Typography>
              </Grid>
              {cityFeaturesLoading && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Loading climate evidence for yearly snowfall estimate...
                  </Typography>
                </Grid>
              )}
              {cityFeaturesError && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="error.main">
                    {cityFeaturesError.message}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}

          {activity === 'Outdoor sightseeing' && (
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Average visibility</Typography>
                <Typography variant="body2" color="text.secondary">{safeFixed(avgVisibility)} km</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">Dry days (7d)</Typography>
                <Typography variant="body2" color="text.secondary">
                  {dryDayCount} / {rankData.rank.forecast.length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2">UV index (today)</Typography>
                <Typography variant="body2" color="text.secondary">{safeFixed(firstForecastDay?.uvIndex ?? 0)}</Typography>
              </Grid>
            </Grid>
          )}

          {activity === 'Surfing' && (
            <Stack spacing={1} sx={{ mb: 1 }}>
              {cityMarineLoading && <LoadingState label="Loading city marine diagnostics..." />}
              {cityMarineError && (
                <Typography variant="body2" color="error.main">
                  {cityMarineError.message}
                </Typography>
              )}
              {!cityMarineLoading && !cityMarineError && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2">Swell direction</Typography>
                    <Typography variant="body2" color="text.secondary">{formatBearing(firstSwellDirection ?? null)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2">Wind direction</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatBearing(firstForecastDay?.windFromDeg ?? null)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2">Coast orientation</Typography>
                    <Typography variant="body2" color="text.secondary">{formatBearing(coastFaceDeg)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2">Swell period</Typography>
                    <Typography variant="body2" color="text.secondary">{safeFixed(firstSwellPeriod ?? 0)} s</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2">Swell height</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {safeFixed(firstSwellHeight ?? 0)} m / {safeFixed(firstSwellHeightFt ?? 0)} ft
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="subtitle2">Wave height</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {safeFixed(firstWaveHeight ?? 0)} m / {safeFixed(firstWaveHeightFt ?? 0)} ft
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">{windSummary}</Typography>
                  </Grid>
                </Grid>
              )}
            </Stack>
          )}

          {activity === 'Indoor sightseeing' && (
            <Stack spacing={1} sx={{ mb: 1 }}>
              {cityPoiLoading && <LoadingState label="Loading indoor POI diagnostics..." />}
              {cityPoiError && (
                <Typography variant="body2" color="error.main">
                  {cityPoiError.message}
                </Typography>
              )}
              {!cityPoiLoading && !cityPoiError && cityPoiData?.cityPoiSummary && (
                <>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2">Museums</Typography>
                      <Typography variant="body2" color="text.secondary">{cityPoiData.cityPoiSummary.museumsCount}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2">Galleries</Typography>
                      <Typography variant="body2" color="text.secondary">{cityPoiData.cityPoiSummary.galleriesCount}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2">Attractions</Typography>
                      <Typography variant="body2" color="text.secondary">{cityPoiData.cityPoiSummary.attractionsCount}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2">POI total</Typography>
                      <Typography variant="body2" color="text.secondary">{cityPoiData.cityPoiSummary.poiCount}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2">Density / 100 km²</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {safeFixed(cityPoiData.cityPoiSummary.densityPer100Km2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2">Confidence</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {safeFixed(cityPoiData.cityPoiSummary.confidence * 100)}%
                      </Typography>
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip label={`Source: ${cityPoiData.cityPoiSummary.source}`} size="small" variant="outlined" />
                    <Chip label={`Updated: ${formatDate(cityPoiData.cityPoiSummary.computedAt.slice(0, 10))}`} size="small" variant="outlined" />
                  </Stack>
                </>
              )}
            </Stack>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            Weekly factors
          </Typography>
          <Grid container spacing={2}>
            {selectedActivity.week.factors.map((factor) => {
              const surfInline = activity === 'Surfing' ? formatSurfFactorInline(factor) : null;

              return (
                <Grid key={factor.name} item xs={12} sm={6} md={4}>
                  {activity === 'Surfing' && surfInline ? (
                    <>
                      <Typography variant="subtitle2">{surfInline.label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {surfInline.value}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="subtitle2">{factor.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        value: {String(factor.value)}
                      </Typography>
                    </>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    score: {safeFixed(factor.score0to100)} / 100
                  </Typography>
                </Grid>
              );
            })}
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Why this score
          </Typography>
          <Stack spacing={0.5}>
            {selectedActivity.week.reasons.map((reason) => (
              <Typography key={reason} variant="body2">
                • {reason}
              </Typography>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {activity === 'Surfing' && (
        <Stack spacing={1}>
          <Button
            variant="outlined"
            onClick={() => setShowSurfSpotTools((current) => !current)}
            sx={{ alignSelf: 'flex-start' }}
          >
            {showSurfSpotTools ? 'Hide map & spot tools' : 'Open map & spot tools'}
          </Button>
          {showSurfSpotTools && (
            <SurfSpotPanel
              cityName={rankData.rank.location}
              cityCoordinates={{ latitude: rankData.rank.latitude, longitude: rankData.rank.longitude }}
              citySurfScore={selectedActivity}
              selectedSpot={selectedSpot}
              spotScore={spotScore}
              marineData={spotMarineData}
              coastFaceDeg={spotRankData?.coast?.faceDeg ?? null}
              windFromDeg={spotRankData?.forecast?.[0]?.windFromDeg ?? null}
              loading={spotLoading}
              error={spotError}
              onSelectSpot={setSelectedSpot}
            />
          )}
        </Stack>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            Daily breakdown
          </Typography>
          <Stack spacing={1.5}>
            {selectedActivity.dayScores.map((dayScore) => {
              const forecast = forecastByDate.get(dayScore.date);
              const surfDaily = marineDailyByDate.get(dayScore.date);
              const surfSwellFromFactor = findFactorValue(dayScore.detail.factors, 'Swell height');
              const surfPeriodFromFactor = findFactorValue(dayScore.detail.factors, 'Swell period');
              const surfWaterTempFromFactor = findFactorValue(dayScore.detail.factors, 'Water temperature');
              const surfWindQualityFactor = dayScore.detail.factors.find((item) => item.name.toLowerCase().startsWith('wind quality'));
              const swellHeightM = surfDaily?.swellHeightM ?? surfSwellFromFactor;
              const swellHeightFt = metersToFeet(swellHeightM);
              const waveHeightM = surfDaily?.waveHeightM ?? surfDaily?.swellHeightM ?? surfSwellFromFactor;
              const waveHeightFt = metersToFeet(waveHeightM);
              const swellPeriodS = surfDaily?.swellPeriodS ?? surfPeriodFromFactor;

              return (
                <Card key={dayScore.date} variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {formatDate(dayScore.date)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {safeFixed(dayScore.detail.score0to100)} ({dayScore.detail.rating})
                      </Typography>
                    </Stack>

                    {activity === 'Surfing' ? (
                      <Grid container spacing={1} sx={{ mb: 0.5 }}>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="caption" color="text.secondary">
                            Swell: {swellHeightM !== null ? `${safeFixed(swellHeightM)} m / ${safeFixed(swellHeightFt ?? 0)} ft` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="caption" color="text.secondary">
                            Wave: {waveHeightM !== null ? `${safeFixed(waveHeightM)} m / ${safeFixed(waveHeightFt ?? 0)} ft` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="caption" color="text.secondary">
                            Swell period: {swellPeriodS !== null ? `${safeFixed(swellPeriodS)} s` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="caption" color="text.secondary">
                            Wind: {forecast ? `${safeFixed(msToKmh(forecast.windSpeedMps) ?? 0)} km/h` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="caption" color="text.secondary">
                            Wind direction: {forecast ? formatBearing(forecast.windFromDeg) : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                          <Typography variant="caption" color="text.secondary">
                            Water temp: {surfWaterTempFromFactor !== null ? `${safeFixed(surfWaterTempFromFactor)} C` : 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <Chip
                              label={`Wind quality: ${safeFixed(surfWindQualityFactor?.score0to100 ?? 0)} / 100`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`Rating: ${dayScore.detail.rating}`}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        </Grid>
                      </Grid>
                    ) : (
                      <>
                        {forecast && (
                          <Grid container spacing={1} sx={{ mb: 0.5 }}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Temp: {safeFixed(forecast.tempCMin)} to {safeFixed(forecast.tempCMax)} C
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Rain: {safeFixed(forecast.precipitationMm)} mm ({safeFixed(forecast.precipitationProbabilityPct)}%)
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Wind: {safeFixed(msToKmh(forecast.windSpeedMps) ?? 0)} km/h
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Snow: {safeFixed(forecast.snowfallCm)} cm new / {safeFixed(forecast.snowDepthCm)} cm depth
                              </Typography>
                            </Grid>
                          </Grid>
                        )}

                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          {dayScore.detail.factors.slice(0, 3).map((factor) => (
                            <Chip
                              key={`${dayScore.date}-${factor.name}`}
                              label={`${factor.name}: ${safeFixed(factor.score0to100)}`}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default DetailsPage;
