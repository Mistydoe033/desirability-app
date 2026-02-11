import { Grid, Stack, Typography } from '@mui/material';
import { RankResult } from '../../../types';
import { ActivityCard } from './ActivityCard';

interface RankResultsProps {
  result: RankResult;
  onViewDetails: (activityName: string) => void;
}

export function RankResults({ result, onViewDetails }: RankResultsProps) {
  const sortedActivities = [...result.activities].sort(
    (left, right) => right.week.score0to100 - left.week.score0to100
  );

  return (
    <Stack spacing={2}>
      <Stack spacing={0.5}>
        <Typography variant="h4" sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>
          {result.location}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Lat {result.latitude.toFixed(3)} / Lon {result.longitude.toFixed(3)}
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        {sortedActivities.map((activity) => (
          <Grid key={activity.activity} item xs={12} sm={6} md={3}>
            <ActivityCard activity={activity} onViewDetails={onViewDetails} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
