import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Skeleton,
  Divider,
  Stack,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CloudIcon from '@mui/icons-material/Cloud';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import {
  fetchAlertsStart,
  fetchAlertsSuccess,
  fetchAlertsFailure,
  markAllRead,
  updateAlertStatus,
} from '../../store/slices/alertsSlice';
import { alertsApi } from '../../api/alerts/alerts.api';
import type { AlertRecord, AlertStatus } from '../../types/alert.types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function typeLabel(type: AlertRecord['type']) {
  if (type === 'fire') return 'Fire';
  if (type === 'smoke') return 'Smoke';
  return 'Fire & Smoke';
}

function typeIcon(type: AlertRecord['type']) {
  if (type === 'smoke') return <CloudIcon fontSize="small" />;
  return <LocalFireDepartmentIcon fontSize="small" />;
}

function riskColor(riskLevel: string): 'error' | 'warning' | 'info' | 'success' | 'default' {
  if (riskLevel === 'critical') return 'error';
  if (riskLevel === 'high') return 'warning';
  if (riskLevel === 'medium') return 'info';
  return 'default';
}

function statusColor(status: AlertStatus): 'warning' | 'success' | 'default' {
  if (status === 'pending') return 'warning';
  if (status === 'resolved') return 'success';
  return 'default';
}

// ── Alert Card ─────────────────────────────────────────────────────────────────

interface AlertCardProps {
  alert: AlertRecord;
  cameraName: string;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}

function AlertCard({ alert, cameraName, onAcknowledge, onResolve }: AlertCardProps) {
  const imageUrl = `${API_URL}${alert.alertSnapshotUrl}`;

  return (
    <Card
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor:
          alert.riskLevel === 'critical'
            ? 'error.dark'
            : alert.riskLevel === 'high'
              ? 'warning.dark'
              : 'rgba(46,125,50,0.2)',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Annotated snapshot */}
      <CardMedia
        component="img"
        image={imageUrl}
        alt={`Alert from ${cameraName}`}
        sx={{ height: 200, objectFit: 'cover', bgcolor: '#111' }}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />

      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* Header row */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          {typeIcon(alert.type)}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flexGrow: 1 }}>
            {typeLabel(alert.type)} detected
          </Typography>
          <Chip
            label={alert.riskLevel.toUpperCase()}
            color={riskColor(alert.riskLevel)}
            size="small"
            sx={{ fontWeight: 700, fontSize: 10 }}
          />
        </Stack>

        <Divider sx={{ mb: 1, borderColor: 'rgba(255,255,255,0.08)' }} />

        {/* Details */}
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            <strong>Camera:</strong> {cameraName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Confidence:</strong>{' '}
            <span style={{ color: alert.maxConfidence >= 0.9 ? '#f44336' : '#ff9800' }}>
              {(alert.maxConfidence * 100).toFixed(0)}%
            </span>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Detected:</strong> {formatTimestamp(alert.detectionTimestamp)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Created:</strong> {formatTimestamp(alert.createdAt)}
          </Typography>
        </Stack>

        {/* Status chip */}
        <Box sx={{ mt: 1.5 }}>
          <Chip
            label={alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
            color={statusColor(alert.status)}
            size="small"
            icon={alert.status === 'resolved' ? <CheckCircleIcon /> : <ScheduleIcon />}
          />
        </Box>

        {/* Note if present */}
        {alert.note && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Note: {alert.note}
          </Typography>
        )}
      </CardContent>

      {/* Actions — only shown for non-resolved alerts */}
      {alert.status !== 'resolved' && (
        <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
          {alert.status === 'pending' && (
            <Button
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => onAcknowledge(alert.id)}
            >
              Acknowledge
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            color="success"
            onClick={() => onResolve(alert.id)}
          >
            Resolve
          </Button>
        </CardActions>
      )}
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const dispatch = useAppDispatch();
  const { alerts, isLoading, error } = useAppSelector((s) => s.alerts);
  const cameras = useAppSelector((s) => s.cameras.cameras);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  // Map cameraId → cameraName for display
  const cameraMap = Object.fromEntries(
    cameras.map((c) => [c.id, c.name]),
  );

  // Mark all as read when visiting this page
  useEffect(() => {
    dispatch(markAllRead());
  }, [dispatch]);

  // Fetch alert history on mount
  useEffect(() => {
    dispatch(fetchAlertsStart());
    alertsApi
      .getAll()
      .then((res) => {
        dispatch(fetchAlertsSuccess(res.data));
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : 'Failed to load alerts';
        dispatch(fetchAlertsFailure(msg));
      });
  }, [dispatch]);

  const handleAcknowledge = useCallback(
    async (id: string) => {
      try {
        const res = await alertsApi.updateStatus(id, 'acknowledged');
        dispatch(updateAlertStatus({ id, status: 'acknowledged', note: res.data.note }));
        setSnackbarMsg('Alert acknowledged');
        setSnackbarOpen(true);
      } catch {
        setSnackbarMsg('Failed to update alert');
        setSnackbarOpen(true);
      }
    },
    [dispatch],
  );

  const handleResolve = useCallback(
    async (id: string) => {
      try {
        const res = await alertsApi.updateStatus(id, 'resolved');
        dispatch(updateAlertStatus({ id, status: 'resolved', note: res.data.note }));
        setSnackbarMsg('Alert resolved');
        setSnackbarOpen(true);
      } catch {
        setSnackbarMsg('Failed to update alert');
        setSnackbarOpen(true);
      }
    },
    [dispatch],
  );

  const filteredAlerts =
    statusFilter === 'all'
      ? alerts
      : alerts.filter((a) => a.status === statusFilter);

  return (
    <Box sx={{ p: 3 }}>
      {/* Page header */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <NotificationsActiveIcon color="secondary" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Alerts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time fire and smoke detection alerts
          </Typography>
        </Box>

        {/* Filter control */}
        <Box sx={{ ml: 'auto', minWidth: 160 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status filter</InputLabel>
            <Select
              label="Status filter"
              value={statusFilter}
              onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="acknowledged">Acknowledged</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Stack>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredAlerts.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            gap: 2,
            opacity: 0.5,
          }}
        >
          <NotificationsActiveIcon sx={{ fontSize: 64 }} />
          <Typography variant="h6">No alerts yet</Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            Alerts will appear here when fire or smoke is detected with&nbsp;
            confidence ≥ 70%.
          </Typography>
        </Box>
      )}

      {/* Alert grid */}
      {!isLoading && filteredAlerts.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
          </Typography>
          <Grid container spacing={2}>
            {filteredAlerts.map((alert) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={alert.id}>
                <Tooltip
                  title={`Camera ID: ${alert.cameraId}`}
                  placement="top"
                  arrow
                  disableHoverListener={!!cameraMap[alert.cameraId]}
                >
                  <Box sx={{ height: '100%' }}>
                    <AlertCard
                      alert={alert}
                      cameraName={cameraMap[alert.cameraId] ?? `Camera ${alert.cameraId.slice(-6)}`}
                      onAcknowledge={handleAcknowledge}
                      onResolve={handleResolve}
                    />
                  </Box>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Action feedback snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
