import { useEffect, useCallback, useState } from 'react';
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
import CameraDetailDialog from '../../components/dashboard/CameraDetailDialog/CameraDetailDialog';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import {
  fetchCamerasStart,
  fetchCamerasSuccess,
  fetchCamerasFailure,
  updateLatestDetection,
} from '../../store/slices/camerasSlice';
import { camerasApi } from '../../api/cameras/cameras.api';
import { useSocketContext } from '../../contexts/SocketContext';
import type { Camera, RiskLevel } from '../../types/camera.types';

// ── Stat card component (used in the summary row) ─────────────────────────────

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
        <Typography variant="h5" sx={{ fontWeight: 700 }} color={color}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

// ── Dashboard page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { cameras, latestDetections, isLoading } = useAppSelector((s) => s.cameras);

  // Which camera's detail dialog is open (null = closed)
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  /**
   * Get setSubscribedCameras from the socket context.
   * The actual socket lives in Layout so it stays alive across page navigations.
   */
  const { setSubscribedCameras } = useSocketContext();

  /**
   * Fetch all cameras from the backend on mount.
   *
   * After fetching, we also seed the Redux latestDetections map with the
   * embedded latestDetection from each camera document. This way the cards
   * show the last known state immediately, before the WebSocket sends anything.
   */
  useEffect(() => {
    async function loadCameras() {
      dispatch(fetchCamerasStart());
      try {
        const response = await camerasApi.getAll();
        const fetchedCameras = response.data;

        dispatch(fetchCamerasSuccess(fetchedCameras));

        // Seed initial detection state from the embedded latestDetection field.
        // Each camera may already have a latestDetection from a previous Python run.
        for (const camera of fetchedCameras) {
          if (camera.latestDetection) {
            dispatch(
              updateLatestDetection({
                cameraId: camera.id,
                ...camera.latestDetection,
              }),
            );
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load cameras';
        dispatch(fetchCamerasFailure(message));
      }
    }

    void loadCameras();
  }, [dispatch]);

  /**
   * Stable wrapper around setSubscribedCameras.
   * Passed to CameraGrid as onVisibleCamerasChange.
   * CameraGrid calls this every time the filter changes.
   */
  const handleVisibleCamerasChange = useCallback(
    (ids: string[]) => {
      setSubscribedCameras(ids);
    },
    [setSubscribedCameras],
  );

  // ── Derived stats ────────────────────────────────────────────────────────────

  const activeCameras = cameras.filter((c) => c.isActive).length;

  const alertCount = Object.values(latestDetections).filter(
    (d) => d.riskLevel === 'high' || d.riskLevel === 'critical',
  ).length;

  const highestRisk: RiskLevel = alertCount > 0 ? 'high' : 'none';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Header row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Live Monitoring
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time forest fire detection overview
          </Typography>
        </Box>
        <Chip
          icon={highestRisk === 'none' ? <CheckCircleIcon /> : <WarningAmberIcon />}
          label={
            highestRisk === 'none'
              ? 'All Clear'
              : `${alertCount} Alert${alertCount > 1 ? 's' : ''}`
          }
          color={highestRisk === 'none' ? 'success' : 'error'}
          variant="outlined"
        />
      </Box>

      {/* Stats row */}
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

      {/* Camera grid — handles filter and room subscriptions */}
      <CameraGrid
        cameras={cameras}
        latestDetections={latestDetections}
        isLoading={isLoading}
        onVisibleCamerasChange={handleVisibleCamerasChange}
        onCameraClick={setSelectedCamera}
      />

      {/* Camera detail dialog — two tabs: Detection View + Live Feed */}
      <CameraDetailDialog
        camera={selectedCamera}
        onClose={() => setSelectedCamera(null)}
      />
    </Box>
  );
}
