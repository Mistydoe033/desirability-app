import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
  Button
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ActivityResult } from '../../../types';
import { formatDate, metersToFeet, safeFixed } from '../../../utils/format';

interface ActivityCardProps {
  activity: ActivityResult;
  onViewDetails?: (activityName: string) => void;
}

function describeFactor(score: number): string {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'good';
  if (score >= 40) return 'mixed';
  return 'weak';
}

function scoreDriverPrefix(activityName: ActivityResult['activity']): string {
  if (activityName === 'Skiing') return 'Skiing is this score because';
  if (activityName === 'Surfing') return 'Surfing is this score because';
  if (activityName === 'Outdoor sightseeing') return 'Outdoor sightseeing is this score because';
  return 'Indoor sightseeing is this score because';
}

function activityAccent(activity: ActivityResult['activity']): string {
  if (activity === 'Skiing') return '#7ab8ff';
  if (activity === 'Surfing') return '#46d4ff';
  if (activity === 'Outdoor sightseeing') return '#7ce7ad';
  return '#f2c27b';
}

function formatFactorValue(activity: ActivityResult['activity'], factor: ActivityResult['week']['factors'][number]): string {
  const numericValue = typeof factor.value === 'number' && Number.isFinite(factor.value) ? factor.value : null;
  const baseName = factor.name.replace(/\s*\([^)]*\)\s*$/, '');
  const unitMatch = factor.name.match(/\(([^)]+)\)/);
  const unit = unitMatch ? unitMatch[1] : null;

  if (activity === 'Surfing' && (baseName === 'Swell height' || baseName === 'Wave height') && numericValue !== null) {
    const feet = metersToFeet(numericValue);
    return `${safeFixed(numericValue)} m${feet !== null ? ` / ${safeFixed(feet)} ft` : ''}`;
  }

  if (numericValue !== null) {
    if (unit) {
      return `${safeFixed(numericValue)} ${unit}`;
    }

    return safeFixed(numericValue);
  }

  return String(factor.value);
}

function factorLabel(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '');
}

export function ActivityCard({ activity, onViewDetails }: ActivityCardProps) {
  const accent = activityAccent(activity.activity);
  const rankedFactors = [...activity.week.factors].sort(
    (left, right) => right.score0to100 - left.score0to100
  );
  const topDrivers = rankedFactors.slice(0, 2).filter((factor) => factor.score0to100 > 0);
  const limiter = rankedFactors[rankedFactors.length - 1];
  const visibleFactors = activity.week.factors.slice(0, 3);
  const factorSlots = [visibleFactors[0] ?? null, visibleFactors[1] ?? null, visibleFactors[2] ?? null];

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(170deg, ${alpha(accent, 0.12)} 0%, rgba(17,22,42,0.95) 42%, rgba(17,22,42,0.95) 100%)`,
        transition: 'transform 0.18s ease, border-color 0.18s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: alpha(accent, 0.7)
        }
      }}
    >
      <Box
        sx={{
          height: 3,
          backgroundColor: accent,
          opacity: 0.9
        }}
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
          <Box sx={{ minHeight: 112 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                lineHeight: 1.2,
                minHeight: '2.4em'
              }}
            >
              {activity.activity}
            </Typography>
            <Chip
              label={activity.week.rating}
              size="small"
              sx={{
                mt: 0.75,
                borderColor: alpha(accent, 0.7),
                color: 'text.primary',
                backgroundColor: alpha(accent, 0.12)
              }}
              variant="outlined"
            />
          </Box>

          <Box sx={{ minWidth: 88, textAlign: 'right' }}>
            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {safeFixed(activity.week.score0to100)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Weekly score
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, activity.week.score0to100))}
              sx={{
                mt: 0.5,
                height: 6,
                borderRadius: 999,
                backgroundColor: alpha('#ffffff', 0.12),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: accent
                }
              }}
            />
          </Box>
        </Stack>

        <Box sx={{ minHeight: 162 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
            Key signals
          </Typography>
          <Stack spacing={1}>
            {factorSlots.map((factor, index) => (
              <Box key={factor?.name ?? `placeholder-${index}`} sx={{ visibility: factor ? 'visible' : 'hidden' }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                    alignItems: 'baseline',
                    columnGap: 1.5
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {factor ? factorLabel(factor.name) : 'placeholder'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                      fontFeatureSettings: '"tnum" 1'
                    }}
                  >
                    {factor ? `${formatFactorValue(activity.activity, factor)} · ${safeFixed(factor.score0to100, 0)}/100` : '0.0 · 0/100'}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={factor ? Math.max(0, Math.min(100, factor.score0to100)) : 0}
                  sx={{
                    mt: 0.35,
                    height: 5,
                    borderRadius: 999,
                    backgroundColor: alpha('#ffffff', 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: alpha(accent, 0.9)
                    }
                  }}
                />
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ minHeight: 170 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
            Why this score
          </Typography>
          <Box
            sx={{
              p: 1,
              minHeight: 132,
              borderRadius: 1.5,
              border: `1px solid ${alpha(accent, 0.28)}`,
              backgroundColor: alpha(accent, 0.08)
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 4,
                overflow: 'hidden'
              }}
            >
              {scoreDriverPrefix(activity.activity)} {topDrivers.length > 0
                ? topDrivers.map((factor) => `${factorLabel(factor.name).toLowerCase()} (${safeFixed(factor.score0to100, 0)}/100, ${describeFactor(factor.score0to100)})`).join(' and ')
                : 'key surf/snow/weather data is currently weak'}
              .
            </Typography>
            {limiter && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 3,
                  overflow: 'hidden',
                  mt: 0.35
                }}
              >
                Biggest limiter: {factorLabel(limiter.name).toLowerCase()} ({safeFixed(limiter.score0to100, 0)}/100, {describeFactor(limiter.score0to100)}).
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ borderColor: alpha('#ffffff', 0.1) }} />

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            4-day trend
          </Typography>
          <Stack spacing={0.75}>
            {activity.dayScores.slice(0, 4).map((dayScore) => (
              <Stack key={dayScore.date} direction="row" justifyContent="space-between" spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(dayScore.date)}
                </Typography>
                <Typography variant="caption" color="text.primary" sx={{ fontWeight: 600 }}>
                  {safeFixed(dayScore.detail.score0to100)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        {onViewDetails && (
          <Button
            variant="outlined"
            onClick={() => onViewDetails(activity.activity)}
            sx={{
              borderColor: alpha(accent, 0.55),
              color: accent,
              '&:hover': {
                borderColor: accent,
                backgroundColor: alpha(accent, 0.12)
              }
            }}
          >
            View details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
