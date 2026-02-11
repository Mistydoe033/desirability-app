import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  Button,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { ReactNode, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { label: 'Home', path: '/' },
  { label: 'Search', path: '/search' },
  { label: 'Browse', path: '/browse' }
];

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const title = useMemo(() => 'Desirability', []);

  const nav = (
    <Stack direction={isMobile ? 'column' : 'row'} spacing={isMobile ? 0 : 1}>
      {navigationItems.map((item) => {
        const selected = location.pathname === item.path;
        return isMobile ? (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={selected}
              onClick={() => {
                navigate(item.path);
                setDrawerOpen(false);
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ) : (
          <Button
            key={item.path}
            color="inherit"
            onClick={() => navigate(item.path)}
            sx={{
              borderBottom: selected ? '2px solid currentColor' : '2px solid transparent',
              borderRadius: 0
            }}
          >
            {item.label}
          </Button>
        );
      })}
    </Stack>
  );

  return (
    <Box sx={{ minHeight: '100vh', background: 'var(--bg-gradient)' }}>
      <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: 'blur(10px)' }}>
        <Toolbar sx={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.02em'
            }}
          >
            {title}
          </Typography>

          {isMobile ? (
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          ) : (
            nav
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 240 }}>
          <List>{nav}</List>
        </Box>
      </Drawer>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
