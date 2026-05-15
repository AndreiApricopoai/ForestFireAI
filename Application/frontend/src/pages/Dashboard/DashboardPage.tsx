import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import VideocamIcon from '@mui/icons-material/Videocam';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CameraGrid from '../../components/dashboard/CameraGrid/CameraGrid';
import { useAppSelector } from '../../hooks/useAppDispatch';
import type { Camera, LatestDetection, RiskLevel } from '../../types/camera.types';

const MOCK_CAMERAS: Camera[] = [
  {
    id: '1', name: 'Drone Alpha', location: 'Northern Zone A',
    sourceType: 'local_video', sourceUrl: '', isActive: true,
    status: 'active', analysisIntervalSeconds: 5, confidenceThreshold: 0.45, createdAt: '',
  },
  {
    id: '2', name: 'Tower Cam B2', location: 'Eastern Ridge',
    sourceType: 'local_video', sourceUrl: '', isActive: true,
    status: 'active', analysisIntervalSeconds: 5, confidenceThreshold: 0.45, createdAt: '',
  },
  {
    id: '3', name: 'Patrol Unit 3', location: 'Southern Valley',
    sourceType: 'local_video', sourceUrl: '', isActive: false,
    status: 'inactive', analysisIntervalSeconds: 5, confidenceThreshold: 0.45, createdAt: '',
  },
  {
    id: '4', name: 'Drone Beta', location: 'Western Perimeter',
    sourceType: 'local_video', sourceUrl: '', isActive: true,
    status: 'active', analysisIntervalSeconds: 5, confidenceThreshold: 0.45, createdAt: '',
  },
];

const MOCK_DETECTIONS: Record<string, LatestDetection> = {
  '1': {
    cameraId: '1', timestamp: new Date().toISOString(), videoTimestampMs: 12000,
    snapshotUrl: null, riskLevel: 'high',
    detections: [{ class: 'fire', confidence: 0.78, bbox: [100, 80, 300, 200] }],
  },
  '2': {
    cameraId: '2', timestamp: new Date().toISOString(), videoTimestampMs: 8000,
    snapshotUrl: null, riskLevel: 'low',
    detections: [{ class: 'smoke', confidence: 0.52, bbox: [50, 30, 200, 150] }],
  },
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}

function StatCard({ label, value, icon, color, sub }: StatCardProps) {
  return (
    <Paper
      sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        border: `1px solid ${color}33`,
        bgcolor: `${color}0a`,
      }}
    >
      <Box sx={{ color, fontSize: 36, lineHeight: 1 }}>{icon}</Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }} color={color}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const { cameras: storeCameras, latestDetections: storeDetections, isLoading } = useAppSelector((s) => s.cameras);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [detections, setDetections] = useState<Record<string, LatestDetection>>({});

  useEffect(() => {
    if (storeCameras.length > 0) {
      setCameras(storeCameras);
      setDetections(storeDetections);
    } else {
      setCameras(MOCK_CAMERAS);
      setDetections(MOCK_DETECTIONS);
    }
  }, [storeCameras, storeDetections]);

  const activeCameras = cameras.filter((c) => c.isActive).length;
  const alertCount = Object.values(detections).filter(
    (d) => d.riskLevel === 'high' || d.riskLevel === 'critical',
  ).length;
  const highestRisk: RiskLevel = alertCount > 0 ? 'high' : 'none';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Live Monitoring</Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time forest fire detection overview
          </Typography>
        </Box>
        <Chip
          icon={highestRisk === 'none' ? <CheckCircleIcon /> : <WarningAmberIcon />}
          label={highestRisk === 'none' ? 'All Clear' : `${alertCount} Alert${alertCount > 1 ? 's' : ''}`}
          color={highestRisk === 'none' ? 'success' : 'error'}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Active Cameras"
            value={`${activeCameras} / ${cameras.length}`}
            icon={<VideocamIcon fontSize="inherit" />}
            color="#4caf50"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Active Alerts"
            value={alertCount}
            icon={<LocalFireDepartmentIcon fontSize="inherit" />}
            color={alertCount > 0 ? '#f44336' : '#4caf50'}
            sub={alertCount > 0 ? 'Requires attention' : 'No active alerts'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            label="Analysis Interval"
            value="5s"
            icon={<CheckCircleIcon fontSize="inherit" />}
            color="#2196f3"
            sub="Per camera feed"
          />
        </Grid>
      </Grid>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Camera Feeds
      </Typography>

      <CameraGrid
        cameras={cameras}
        latestDetections={detections}
        isLoading={isLoading}
      />
    </Box>
  );
}
