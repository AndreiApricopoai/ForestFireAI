import { Box, Button, Container, Typography, Stack, Chip } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import VideocamIcon from '@mui/icons-material/Videocam';
import BoltIcon from '@mui/icons-material/Bolt';
import ShieldIcon from '@mui/icons-material/Shield';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useAppDispatch';
import { useEffect } from 'react';

const FEATURES = [
  {
    icon: <VideocamIcon />,
    title: 'Multi-Source Monitoring',
    desc: 'Monitor drones, static cameras and RTSP streams from a single dashboard.',
  },
  {
    icon: <BoltIcon />,
    title: 'Real-Time AI Detection',
    desc: 'YOLOv8-powered fire and smoke detection, analyzed every 5 seconds per feed.',
  },
  {
    icon: <ShieldIcon />,
    title: 'Instant Alerts',
    desc: 'Automated alert system triggers when fire or smoke confidence exceeds thresholds.',
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
      <Box
        component="nav"
        sx={{
          px: 4,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(46,125,50,0.15)',
        }}
      >
        <LocalFireDepartmentIcon sx={{ color: 'secondary.main', mr: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }} color="primary.light">
          ForestFire AI
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="text" color="inherit" onClick={() => navigate('/login')} sx={{ mr: 1 }}>
          Login
        </Button>
        <Button variant="contained" color="primary" onClick={() => navigate('/register')}>
          Get Started
        </Button>
      </Box>

      <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip
            icon={<LocalFireDepartmentIcon />}
            label="YOLOv8 Powered"
            color="secondary"
            size="small"
            sx={{ mb: 3, fontWeight: 600 }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              background: 'linear-gradient(135deg, #4caf50 0%, #ff6f00 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2.2rem', md: '3.5rem' },
            }}
          >
            Forest Fire Detection
            <br />
            at Scale
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 560, mx: 'auto', fontWeight: 400 }}>
            Real-time AI monitoring platform for drone and camera feeds.
            Detect fire and smoke before it spreads.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={() => navigate('/register')}
              sx={{ px: 4 }}
            >
              Start Monitoring
            </Button>
            <Button
              variant="outlined"
              size="large"
              color="primary"
              onClick={() => navigate('/login')}
              sx={{ px: 4 }}
            >
              Sign In
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {FEATURES.map((f) => (
            <Box
              key={f.title}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid rgba(46,125,50,0.2)',
                bgcolor: 'background.paper',
                textAlign: 'center',
              }}
            >
              <Box sx={{ color: 'primary.light', mb: 1.5, '& svg': { fontSize: 36 } }}>
                {f.icon}
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
                {f.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {f.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      <Box sx={{ textAlign: 'center', py: 3, borderTop: '1px solid rgba(46,125,50,0.1)' }}>
        <Typography variant="caption" color="text.secondary">
          ForestFire AI — Dissertation Project © 2026
        </Typography>
      </Box>
    </Box>
  );
}
