import { useLazyQuery } from '@apollo/client';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RANK_QUERY } from '../api';
import { ErrorState, LoadingState } from '../components';
import { RankResults } from '../features/rankings';
import { CitySearchInput } from '../features/search';
import { RankQueryData, RankQueryVariables } from '../types';

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const cityFromUrl = searchParams.get('city') ?? '';
  const [selectedCity, setSelectedCity] = useState<string>(cityFromUrl);
  const lastRequestedCityRef = useRef<string>('');

  const [runRankQuery, { data, loading, error, called }] = useLazyQuery<RankQueryData, RankQueryVariables>(
    RANK_QUERY,
    {
      fetchPolicy: 'cache-first'
    }
  );

  const errorMessage = useMemo(() => error?.message ?? null, [error]);

  const runSearch = (cityName: string) => {
    const trimmedCity = cityName.trim();
    if (trimmedCity.length === 0) {
      return;
    }

    setSelectedCity(trimmedCity);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('city', trimmedCity);
    setSearchParams(nextParams, { replace: true });

    runRankQuery({ variables: { city: trimmedCity } });
    lastRequestedCityRef.current = trimmedCity.toLowerCase();
  };

  useEffect(() => {
    const trimmedCity = cityFromUrl.trim();
    if (trimmedCity.length === 0) {
      return;
    }

    setSelectedCity(trimmedCity);

    const normalized = trimmedCity.toLowerCase();
    if (lastRequestedCityRef.current === normalized) {
      return;
    }

    runRankQuery({ variables: { city: trimmedCity } });
    lastRequestedCityRef.current = normalized;
  }, [cityFromUrl, runRankQuery]);

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
            Search by city
          </Typography>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <Box sx={{ flexGrow: 1 }}>
              <CitySearchInput
                initialValue={selectedCity}
                onInputValueChange={setSelectedCity}
                onCitySelected={(cityName) => runSearch(cityName)}
              />
            </Box>
            <Button
              variant="outlined"
              onClick={() => {
                runSearch(selectedCity);
              }}
            >
              Score
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {loading && <LoadingState label="Scoring activities for city..." />}
      {errorMessage && <ErrorState message={errorMessage} />}

      {data?.rank && (
        <RankResults
          result={data.rank}
          onViewDetails={(activityName) => {
            const returnTo = `/search?city=${encodeURIComponent(data.rank.location)}`;
            navigate(
              `/details?city=${encodeURIComponent(data.rank.location)}&activity=${encodeURIComponent(activityName)}&returnTo=${encodeURIComponent(returnTo)}`
            );
          }}
        />
      )}

      {called && !loading && !data?.rank && !errorMessage && (
        <Typography color="text.secondary">No ranking data returned for the selected city.</Typography>
      )}
    </Stack>
  );
}

export default SearchPage;
