import { useQuery } from '@apollo/client';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import {
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
  Button
} from '@mui/material';
import { keyframes } from '@mui/system';
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TOP_CITIES_QUERY } from '../api';
import { ErrorState, LoadingState } from '../components';
import { ActivityName, TopCitiesQueryData, TopCitiesQueryVariables } from '../types';

const activities: ActivityName[] = ['Skiing', 'Surfing', 'Outdoor sightseeing', 'Indoor sightseeing'];

function isActivityName(value: string | null): value is ActivityName {
  return (
    value === 'Skiing' ||
    value === 'Surfing' ||
    value === 'Outdoor sightseeing' ||
    value === 'Indoor sightseeing'
  );
}

function RatingStars({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(5, value));
  const rounded = Math.round(clamped * 2) / 2;
  const fullStars = Math.floor(rounded);
  const hasHalfStar = rounded - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <Stack direction="row" spacing={0.15} aria-label={`Rating ${rounded} out of 5`} alignItems="center">
      {Array.from({ length: fullStars }).map((_, index) => (
        <StarIcon key={`full-star-${index}`} fontSize="small" color="primary" />
      ))}
      {hasHalfStar && <StarHalfIcon fontSize="small" color="primary" />}
      {Array.from({ length: emptyStars }).map((_, index) => (
        <StarBorderIcon key={`empty-star-${index}`} fontSize="small" color="disabled" />
      ))}
    </Stack>
  );
}

const shimmer = keyframes`
  0% { transform: translateX(-120%); }
  100% { transform: translateX(220%); }
`;

function BrowseLoadingGrid() {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Grid key={`browse-loading-${index}`} item xs={12} sm={6} md={4}>
          <Card
            sx={(theme) => ({
              position: 'relative',
              overflow: 'hidden',
              height: '100%',
              background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.96)} 75%)`
            })}
          >
            <Box
              sx={(theme) => ({
                position: 'absolute',
                inset: 0,
                width: '45%',
                background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.light, 0.25)}, transparent)`,
                animation: `${shimmer} 1.6s linear infinite`,
                pointerEvents: 'none'
              })}
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Skeleton variant="text" width="58%" height={38} />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="text" width="54%" />
              <Skeleton variant="text" width="52%" />
              <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" width={90} height={24} />
                <Skeleton variant="rounded" width={110} height={24} />
              </Stack>
              <Skeleton variant="rounded" width="100%" height={40} sx={{ mt: 0.5 }} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export function BrowsePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedActivity = useMemo<ActivityName>(() => {
    const activityParam = searchParams.get('activity');
    return isActivityName(activityParam) ? activityParam : 'Skiing';
  }, [searchParams]);

  const tabIndex = useMemo(() => {
    const index = activities.indexOf(selectedActivity);
    return index >= 0 ? index : 0;
  }, [selectedActivity]);

  const { data, loading, error } = useQuery<TopCitiesQueryData, TopCitiesQueryVariables>(TOP_CITIES_QUERY, {
    variables: {
      activity: selectedActivity,
      limit: 12
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first'
  });

  const cities = useMemo(() => {
    const source = data?.topCities ?? [];
    return [...source].sort((left, right) => right.yearlyScore - left.yearlyScore);
  }, [data?.topCities]);
  const showInitialLoading = loading && cities.length === 0;

  return (
    <Stack spacing={2}>
      <Typography variant="h4" sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>
        Top Cities by Activity Annually
      </Typography>

      <Tabs
        value={tabIndex}
        onChange={(_, value: number) => {
          const nextActivity = activities[value];
          if (!nextActivity) {
            return;
          }

          const next = new URLSearchParams(searchParams);
          next.set('activity', nextActivity);
          setSearchParams(next, { replace: true });
        }}
      >
        {activities.map((activity) => (
          <Tab key={activity} label={activity} />
        ))}
      </Tabs>

      {showInitialLoading && (
        <Stack spacing={1.5}>
          <LoadingState label="Building annual rankings from historical data..." />
          <BrowseLoadingGrid />
        </Stack>
      )}
      {error && <ErrorState message={error.message} />}

      {!showInitialLoading && !error && (
        <Grid container spacing={2}>
          {cities.map((city) => {
            const selectedActivityScore = city.activities.find((item) => item.activity === selectedActivity)?.score0to100 ?? 0;
            const selectedTag = { activity: selectedActivity, score0to100: selectedActivityScore };
            const tagActivities = Array.from(
              new Map(
                [...city.activities, selectedTag].map((item) => [item.activity, item])
              ).values()
            );

            return (
              <Grid key={city.id} item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {city.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {city.country}
                    </Typography>
                    <RatingStars value={city.rating} />
                    <Typography variant="body2">
                      Profile score: {selectedActivityScore.toFixed(1)}
                    </Typography>
                    <Typography variant="body2">
                      Weekly score: {city.weeklyScore.toFixed(1)}
                    </Typography>
                    <Typography variant="body2">
                      Yearly score: {city.yearlyScore.toFixed(1)}
                    </Typography>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {tagActivities.map((activity) => (
                        <Chip key={activity.activity} label={activity.activity} size="small" variant="outlined" />
                      ))}
                    </Stack>

                    <Button
                      sx={{ mt: 'auto' }}
                      variant="outlined"
                      onClick={() => {
                        const returnTo = `/browse?activity=${encodeURIComponent(selectedActivity)}`;
                        navigate(
                          `/details?city=${encodeURIComponent(city.name)}&activity=${encodeURIComponent(selectedActivity)}&profileScore=${selectedActivityScore.toFixed(1)}&returnTo=${encodeURIComponent(returnTo)}`
                        );
                      }}
                    >
                      Open details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}

          {cities.length === 0 && (
            <Typography color="text.secondary">No cities available for this activity.</Typography>
          )}
        </Grid>
      )}
    </Stack>
  );
}

export default BrowsePage;
