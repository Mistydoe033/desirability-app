import { alpha, Box, Stack, Typography } from '@mui/material';
import { keyframes } from '@mui/system';

interface LoadingStateProps {
  label?: string;
}

const ringSpin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const corePulse = keyframes`
  0% { transform: scale(0.88); opacity: 0.72; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.88); opacity: 0.72; }
`;

const haloPulse = keyframes`
  0% { transform: scale(0.8); opacity: 0.65; }
  70% { transform: scale(1.22); opacity: 0; }
  100% { transform: scale(1.22); opacity: 0; }
`;

const railSweep = keyframes`
  0% { transform: translateX(-120%); }
  100% { transform: translateX(230%); }
`;

const barPulse = keyframes`
  0%, 100% { opacity: 0.3; transform: scaleY(0.55); }
  50% { opacity: 1; transform: scaleY(1); }
`;

export function LoadingState({ label = 'Loading...' }: LoadingStateProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1.25,
        px: 1.5,
        borderRadius: 2.5,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(
          theme.palette.background.paper,
          0.96
        )} 60%)`,
        boxShadow: `0 10px 28px ${alpha(theme.palette.common.black, 0.22)}`
      })}
    >
      <Box
        sx={(theme) => ({
          position: 'relative',
          width: 42,
          height: 42,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0
        })}
      >
        <Box
          sx={(theme) => ({
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, transparent 0deg, ${alpha(theme.palette.primary.main, 0.95)} 95deg, transparent 260deg)`,
            animation: `${ringSpin} 1.25s linear infinite`
          })}
        />
        <Box
          sx={(theme) => ({
            position: 'absolute',
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.45)}`,
            animation: `${haloPulse} 1.8s ease-out infinite`
          })}
        />
        <Box
          sx={(theme) => ({
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${alpha(theme.palette.primary.light, 0.95)} 0%, ${alpha(
              theme.palette.primary.main,
              0.62
            )} 62%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
            animation: `${corePulse} 1.1s ease-in-out infinite`
          })}
        />
      </Box>

      <Stack spacing={0.8} sx={{ minWidth: 220, flex: 1 }}>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, letterSpacing: 0.15 }}>
          {label}
        </Typography>

        <Box
          sx={(theme) => ({
            position: 'relative',
            overflow: 'hidden',
            height: 6,
            borderRadius: 999,
            backgroundColor: alpha(theme.palette.primary.main, 0.17)
          })}
        >
          <Box
            sx={(theme) => ({
              position: 'absolute',
              inset: 0,
              width: '36%',
              borderRadius: 999,
              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.light, 0.95)}, transparent)`,
              animation: `${railSweep} 1.12s linear infinite`
            })}
          />
        </Box>

        <Stack direction="row" spacing={0.35} sx={{ alignSelf: 'flex-start' }}>
          {[0, 1, 2, 3].map((bar) => (
            <Box
              key={`loading-bar-${bar}`}
              sx={(theme) => ({
                width: 14,
                height: 3,
                borderRadius: 999,
                transformOrigin: 'center',
                backgroundColor: alpha(theme.palette.primary.main, 0.85),
                animation: `${barPulse} 0.95s ease-in-out infinite`,
                animationDelay: `${bar * 0.11}s`
              })}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
