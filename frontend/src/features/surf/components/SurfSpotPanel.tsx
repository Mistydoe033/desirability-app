import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { MapPicker } from '../../../components';
import { ActivityResult, Coordinates, MarineData } from '../../../types';
import { formatBearing, metersToFeet, safeFixed } from '../../../utils/format';

interface SurfSpotPanelProps {
  cityName: string;
  cityCoordinates: Coordinates;
  citySurfScore: ActivityResult;
  selectedSpot: Coordinates | null;
  spotScore: ActivityResult | null;
  marineData: MarineData | null;
  coastFaceDeg: number | null;
  windFromDeg: number | null;
  loading: boolean;
  error: string | null;
  onSelectSpot: (coordinates: Coordinates) => void;
}

function toNumeric(value: string | number): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function findFactorValue(activity: ActivityResult | null, factorPrefix: string): number | null {
  if (!activity) {
    return null;
  }

  const factor = activity.week.factors.find((item) =>
    item.name.toLowerCase().startsWith(factorPrefix.toLowerCase())
  );

  return factor ? toNumeric(factor.value) : null;
}

export function SurfSpotPanel({
  cityName: _cityName,
  cityCoordinates,
  citySurfScore,
  selectedSpot,
  spotScore,
  marineData,
  coastFaceDeg,
  windFromDeg,
  loading,
  error,
  onSelectSpot
}: SurfSpotPanelProps) {
  const hasSelectedSpot = selectedSpot !== null;
  const fallbackSwellHeight = findFactorValue(spotScore, 'Swell height');
  const fallbackWaveHeight = findFactorValue(spotScore, 'Wave height');
  const fallbackSwellPeriod = findFactorValue(spotScore, 'Swell period');
  const fallbackWaterTemp = findFactorValue(spotScore, 'Water temperature');

  const firstWave = marineData?.hourly.swellWaveHeightM[0] ?? fallbackSwellHeight;
  const firstWaveFt = metersToFeet(firstWave ?? null);
  const firstPeriod = marineData?.hourly.swellWavePeriodS[0] ?? fallbackSwellPeriod;
  const firstSwellDirection = marineData?.hourly.swellWaveDirectionDeg[0];
  const firstWaveDirection = marineData?.hourly.waveDirectionDeg[0];
  const firstSeaTemp = marineData?.hourly.seaSurfaceTemperatureC[0] ?? fallbackWaterTemp;
  const firstWaveHeight = marineData?.hourly.waveHeightM[0] ?? fallbackWaveHeight;
  const firstWaveHeightFt = metersToFeet(firstWaveHeight ?? null);

  return (
    <Stack spacing={2}>
      <MapPicker center={cityCoordinates} selectedSpot={selectedSpot} onSelectSpot={onSelectSpot} />

      {hasSelectedSpot && (
        <Card>
          <CardContent>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                City baseline: {safeFixed(citySurfScore.week.score0to100)} ({citySurfScore.week.rating})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Selected spot: {selectedSpot ? `${selectedSpot.latitude.toFixed(4)}, ${selectedSpot.longitude.toFixed(4)}` : '--'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Spot score: {spotScore ? `${safeFixed(spotScore.week.score0to100)} (${spotScore.week.rating})` : '--'}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Stack spacing={0.5}>
            <Typography variant="body2">
              Spot: {selectedSpot ? `${selectedSpot.latitude.toFixed(4)}, ${selectedSpot.longitude.toFixed(4)}` : 'Open map picker to choose coordinates'}
            </Typography>
            <Typography variant="body2">
              Current swell height: {firstWave !== null && firstWave !== undefined ? `${safeFixed(firstWave)} m / ${safeFixed(firstWaveFt ?? 0)} ft` : 'N/A'}
            </Typography>
            <Typography variant="body2">
              Current wave height: {firstWaveHeight !== null && firstWaveHeight !== undefined ? `${safeFixed(firstWaveHeight)} m / ${safeFixed(firstWaveHeightFt ?? 0)} ft` : 'N/A'}
            </Typography>
            <Typography variant="body2">
              Current swell period: {firstPeriod !== null && firstPeriod !== undefined ? `${safeFixed(firstPeriod)} s` : 'N/A'}
            </Typography>
            <Typography variant="body2">
              Swell direction: {formatBearing(firstSwellDirection)}
            </Typography>
            <Typography variant="body2">
              Wave direction: {formatBearing(firstWaveDirection)}
            </Typography>
            <Typography variant="body2">
              Wind direction: {hasSelectedSpot ? formatBearing(windFromDeg) : 'N/A'}
            </Typography>
            <Typography variant="body2">
              Coast orientation: {hasSelectedSpot ? formatBearing(coastFaceDeg) : 'N/A'}
            </Typography>
            <Typography variant="body2">
              Sea temperature: {firstSeaTemp !== null && firstSeaTemp !== undefined ? `${safeFixed(firstSeaTemp)} C` : 'N/A'}
            </Typography>
            {error && <Typography color="error.main">{error}</Typography>}
          </Stack>
        </CardContent>
      </Card>

      {spotScore && (
        <Card>
          <CardContent>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={0.5}>
              {spotScore.week.reasons.map((reason) => (
                <Typography key={reason} variant="body2">
                  • {reason}
                </Typography>
              ))}
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Stack spacing={0.5}>
              {[...spotScore.week.factors]
                .sort((left, right) => right.score0to100 - left.score0to100)
                .slice(0, 3)
                .map((factor) => (
                  <Typography key={factor.name} variant="body2">
                    • {factor.name}: {safeFixed(factor.score0to100)} / 100
                  </Typography>
                ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
