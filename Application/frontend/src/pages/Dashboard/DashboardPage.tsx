import { useEffect, useCallback, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Stack,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CameraGrid from '../../components/dashboard/CameraGrid/CameraGrid';
import CameraDetailDialog from '../../components/dashboard/CameraDetailDialog/CameraDetailDialog';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import {
  fetchCamerasStart,
  fetchCamerasSuccess,
  fetchCamerasFailure,
  updateLatestDetection,
} from '../../store/slices/camerasSlice';
import {
  fetchAlertsStart,
  fetchAlertsSuccess,
  fetchAlertsFailure,
} from '../../store/slices/alertsSlice';
import { camerasApi } from '../../api/cameras/cameras.api';
import { alertsApi } from '../../api/alerts/alerts.api';
import { useSocketContext } from '../../contexts/SocketContext';
import type { Camera } from '../../types/camera.types';

const RISK_ORDER = ['critical', 'high', 'medium', 'low'] as const;
const RISK_COLORS: Record<string, string> = {
  critical: '#b71c1c',
  high:     '#f44336',
  medium:   '#ff9800',
  low:      '#8bc34a',
};

interface CamerasCardProps {
  total: number;
  active: number;
}

function CamerasCard({ total, active }: CamerasCardProps) {
  const inactive = total - active;
  return (
    <Paper sx={{ px: 2.5, py: 2, border: '1px solid rgba(255,255,255,0.07)', bgcolor: 'background.paper' }}>
      {}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <VideocamIcon sx={{ fontSize: 28, color: '#64b5f6', flexShrink: 0 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1, color: 'text.primary' }}>
          {total}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total cameras
        </Typography>
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {}
      <Stack direction="row" spacing={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#4caf50' }}>{active}</Typography>
          <Typography variant="caption" color="text.secondary">active</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>{inactive}</Typography>
          <Typography variant="caption" color="text.secondary">inactive</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

interface AlertsCardProps {
  total: number;
  byRisk: Record<string, number>;
}

function AlertsCard({ total, byRisk }: AlertsCardProps) {
  const breakdown = RISK_ORDER.filter((r) => (byRisk[r] ?? 0) > 0);

  return (
    <Paper sx={{ px: 2.5, py: 2, border: '1px solid rgba(255,255,255,0.07)', bgcolor: 'background.paper' }}>
      {}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <NotificationsNoneIcon sx={{ fontSize: 28, color: total > 0 ? '#f44336' : 'text.secondary', flexShrink: 0 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1, color: total > 0 ? '#f44336' : 'text.primary' }}>
          {total}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unreviewed alerts
        </Typography>
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {}
      {breakdown.length === 0 ? (
        <Typography variant="caption" color="text.secondary">No alerts recorded yet</Typography>
      ) : (
        <Stack direction="row" spacing={2.5} sx={{ flexWrap: 'wrap' }}>
          {breakdown.map((r) => (
            <Box key={r} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: RISK_COLORS[r], flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: RISK_COLORS[r] }}>
                {byRisk[r]}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                {r}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { cameras, latestDetections, isLoading } = useAppSelector((s) => s.cameras);
  const { alerts } = useAppSelector((s) => s.alerts);
  const { user } = useAppSelector((s) => s.auth);
  const isAdmin = user?.role === 'admin';

  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const { setSubscribedCameras } = useSocketContext();

  useEffect(() => {
    async function loadCameras() {
      dispatch(fetchCamerasStart());
      try {
        const response = await camerasApi.getAll();
        const fetchedCameras = response.data;
        dispatch(fetchCamerasSuccess(fetchedCameras));
        for (const camera of fetchedCameras) {
          if (camera.latestDetection) {
            dispatch(updateLatestDetection({ cameraId: camera.id, ...camera.latestDetection }));
          }
        }
      } catch (err) {
        dispatch(fetchCamerasFailure(err instanceof Error ? err.message : 'Failed to load cameras'));
      }
    }
    void loadCameras();
  }, [dispatch]);

  useEffect(() => {
    if (!isAdmin) return;
    dispatch(fetchAlertsStart());
    alertsApi
      .getAll()
      .then((res) => dispatch(fetchAlertsSuccess(res.data)))
      .catch((err: unknown) => {
        dispatch(fetchAlertsFailure(err instanceof Error ? err.message : 'Failed to load alerts'));
      });
  }, [dispatch, isAdmin]);

  const handleVisibleCamerasChange = useCallback(
    (ids: string[]) => setSubscribedCameras(ids),
    [setSubscribedCameras],
  );

  const activeCameras = cameras.filter((c) => c.isActive).length;

  const openAlerts = alerts.filter((a) => a.status !== 'resolved');

  const alertsByRisk: Record<string, number> = {};
  for (const alert of openAlerts) {
    if (alert.riskLevel) {
      alertsByRisk[alert.riskLevel] = (alertsByRisk[alert.riskLevel] ?? 0) + 1;
    }
  }

  return (
    <Box>
      {}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Live Monitoring
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time forest fire detection overview
        </Typography>
      </Box>

      {}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: isAdmin ? 6 : 12 }}>
          <CamerasCard total={cameras.length} active={activeCameras} />
        </Grid>

        {isAdmin && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <AlertsCard total={openAlerts.length} byRisk={alertsByRisk} />
          </Grid>
        )}
      </Grid>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Camera Feeds
      </Typography>

      <CameraGrid
        cameras={cameras}
        latestDetections={latestDetections}
        isLoading={isLoading}
        onVisibleCamerasChange={handleVisibleCamerasChange}
        onCameraClick={setSelectedCamera}
      />

      <CameraDetailDialog
        camera={selectedCamera}
        onClose={() => setSelectedCamera(null)}
      />
    </Box>
  );
}
