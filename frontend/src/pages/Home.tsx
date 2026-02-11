import { Box, Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const highlights = [
  {
    title: 'Explainable scoring',
    description: 'Each activity score includes weighted factors and reasons so users can trust recommendations.'
  },
  {
    title: 'City + spot surfing',
    description: 'City baseline uses stored coast orientation while map clicks compute spot-specific offshore/onshore logic.'
  },
  {
    title: 'Precomputed rankings',
    description: 'Top cities are precomputed in Redis and fallback to live scoring when cache is cold.'
  }
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={4}>
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" sx={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>
          Weather-Aware Desirability
        </Typography>
        <Typography sx={{ mt: 1, maxWidth: 680 }} color="text.secondary">
          Compare cities across skiing, surfing, hiking, and indoor experiences with transparent scores powered by live forecast and marine data.
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button variant="contained" onClick={() => navigate('/search')}>
            Search a city
          </Button>
          <Button variant="outlined" onClick={() => navigate('/browse')}>
            Browse top cities
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        {highlights.map((item) => (
          <Grid key={item.title} item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export default HomePage;
