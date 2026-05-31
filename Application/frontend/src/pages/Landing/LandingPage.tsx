import { Box, Button, Container, Typography } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import VideocamIcon from '@mui/icons-material/Videocam';
import NotificationsIcon from '@mui/icons-material/Notifications';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useEffect } from 'react';

const FEATURES = [
  {
    icon: <VideocamIcon />,
    title: 'Camera Feed Monitoring',
    desc: 'Connect drone footage or static camera feeds and view all streams from a single interface.',
  },
  {
    icon: <QueryStatsIcon />,
    title: 'Automated Detection',
    desc: 'Each feed is periodically analysed by a trained model to identify fire and smoke in frames.',
  },
  {
    icon: <NotificationsIcon />,
    title: 'Threshold-Based Alerts',
    desc: 'An alert is recorded and sent when detection confidence exceeds the configured threshold.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Navbar ── */}
      <Box
        component="nav"
        sx={{
          px: 4,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <LocalFireDepartmentIcon sx={{ color: '#ff0000', mr: 1, fontSize: 20 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
          ForestFire AI
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="text"
          onClick={() => navigate('/login')}
          sx={{ mr: 1, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
        >
          Login
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/register')}
          sx={{
            borderColor: 'rgba(255,255,255,0.2)',
            color: 'text.primary',
            '&:hover': { borderColor: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.04)' },
          }}
        >
          Register
        </Button>
      </Box>

      {/* ── Hero ── */}
      <Container
        maxWidth="lg"
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 10 }}
      >
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2.5,
              color: 'text.primary',
              fontSize: { xs: '2rem', md: '3.2rem' },
              letterSpacing: '-0.5px',
            }}
          >
            Forest Fire Detection System
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: 520,
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.7,
            }}
          >
            A platform for real-time fire and smoke detection
            across drone and camera feeds using computer vision.
          </Typography>
        </Box>

        {/* ── Feature cards ── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {FEATURES.map((f) => (
            <Box
              key={f.title}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.07)',
                bgcolor: 'background.paper',
                textAlign: 'center',
              }}
            >
              <Box sx={{ color: 'text.secondary', mb: 1.5, '& svg': { fontSize: 30 } }}>
                {f.icon}
              </Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: 'text.primary', mb: 0.75, fontSize: 13 }}
              >
                {f.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {f.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      {/* ── Footer ── */}
      <Box sx={{ textAlign: 'center', py: 3, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="caption" color="text.secondary">
          ForestFire AI — Dissertation Project © 2026
        </Typography>
      </Box>
    </Box>
  );
}
