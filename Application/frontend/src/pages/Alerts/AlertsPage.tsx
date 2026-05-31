import { useEffect, useState, useCallback, useRef } from 'react';
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
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
  type SelectChangeEvent,
} from '@mui/material';
// CircularProgress intentionally omitted — unused
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CloudIcon from '@mui/icons-material/Cloud';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
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
  onOpenImage: (alert: AlertRecord, cameraName: string) => void;
}

function AlertCard({ alert, cameraName, onAcknowledge, onResolve, onOpenImage }: AlertCardProps) {
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
      {/* Annotated snapshot — click to open full-size lightbox */}
      <Box
        sx={{ position: 'relative', cursor: 'pointer' }}
        onClick={() => onOpenImage(alert, cameraName)}
      >
        <CardMedia
          component="img"
          image={imageUrl}
          alt={`Alert from ${cameraName}`}
          sx={{ height: 200, objectFit: 'cover', bgcolor: '#111' }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Hover overlay hint */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.35)' },
            '& .zoom-icon': { opacity: 0, transition: 'opacity 0.2s' },
            '&:hover .zoom-icon': { opacity: 1 },
          }}
        >
          <ZoomInIcon className="zoom-icon" sx={{ color: 'white', fontSize: 40 }} />
        </Box>
      </Box>

      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* Header row */}
        <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
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
        </Stack>

        <Box sx={{ mt: 1.5 }}>
          <Chip
            label={alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
            color={statusColor(alert.status)}
            size="small"
            icon={alert.status === 'resolved' ? <CheckCircleIcon /> : <ScheduleIcon />}
          />
        </Box>

        {alert.note && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Note: {alert.note}
          </Typography>
        )}
      </CardContent>

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

// ── Image lightbox dialog ──────────────────────────────────────────────────────

interface LightboxProps {
  alert: AlertRecord | null;
  cameraName: string;
  onClose: () => void;
}

function AlertLightbox({ alert, cameraName, onClose }: LightboxProps) {
  if (!alert) return null;
  const imageUrl = `${API_URL}${alert.alertSnapshotUrl}`;

  return (
    <Dialog
      open={!!alert}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{ paper: { sx: { bgcolor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)' } } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'white',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          py: 1.5,
        }}
      >
        {typeIcon(alert.type)}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {typeLabel(alert.type)} — {cameraName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTimestamp(alert.detectionTimestamp)} &nbsp;·&nbsp;
            Confidence: {(alert.maxConfidence * 100).toFixed(0)}%&nbsp;·&nbsp;
            <Chip
              label={alert.riskLevel.toUpperCase()}
              color={riskColor(alert.riskLevel)}
              size="small"
              sx={{ height: 18, fontSize: 10, ml: 0.5 }}
            />
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box
          component="img"
          src={imageUrl}
          alt={`Alert from ${cameraName}`}
          sx={{
            width: '100%',
            maxHeight: '80vh',
            objectFit: 'contain',
            display: 'block',
            bgcolor: '#000',
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const dispatch = useAppDispatch();
  const { alerts, isLoading, error } = useAppSelector((s) => s.alerts);
  const cameras = useAppSelector((s) => s.cameras.cameras);

  const PAGE_SIZE = 9;
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  // Lightbox state
  const [lightboxAlert, setLightboxAlert] = useState<AlertRecord | null>(null);
  const [lightboxCamera, setLightboxCamera] = useState('');

  // Track the number of alerts at mount so we can detect newly pushed ones
  const initialAlertCount = useRef<number | null>(null);

  // Map cameraId → cameraName for display
  const cameraMap = Object.fromEntries(cameras.map((c) => [c.id, c.name]));

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
        initialAlertCount.current = res.data.length;
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load alerts';
        dispatch(fetchAlertsFailure(msg));
      });
  }, [dispatch]);

  // Show a toast when a new real-time alert arrives while the user is on this page
  const prevAlertCount = useRef(alerts.length);
  useEffect(() => {
    if (initialAlertCount.current === null) return; // still loading
    if (alerts.length > prevAlertCount.current) {
      const newest = alerts[0];
      const cam = cameraMap[newest?.cameraId] ?? 'a camera';
      setSnackbarMsg(`🔔 New ${typeLabel(newest.type)} alert from ${cam}`);
      setSnackbarOpen(true);
    }
    prevAlertCount.current = alerts.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts.length]);

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

  const handleOpenImage = useCallback((alert: AlertRecord, cameraName: string) => {
    setLightboxAlert(alert);
    setLightboxCamera(cameraName);
  }, []);

  const filteredAlerts =
    statusFilter === 'all' ? alerts : alerts.filter((a) => a.status === statusFilter);

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE));
  const paginatedAlerts = filteredAlerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Box sx={{ p: 3 }}>
      {/* Page header */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, alignItems: 'center' }}>
        <NotificationsActiveIcon color="secondary" />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Alerts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time fire and smoke detection alerts
          </Typography>
        </Box>

        <Box sx={{ ml: 'auto', minWidth: 160 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Status filter</InputLabel>
            <Select
              label="Status filter"
              value={statusFilter}
              onChange={(e: SelectChangeEvent) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="acknowledged">Acknowledged</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Stack>

      {/* Error */}
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
            Alerts will appear here when fire or smoke is detected with confidence ≥ 70%.
          </Typography>
        </Box>
      )}

      {/* Alert grid */}
      {!isLoading && filteredAlerts.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredAlerts.length)} of {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
          </Typography>
          <Grid container spacing={2}>
            {paginatedAlerts.map((alert) => (
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
                      onOpenImage={handleOpenImage}
                    />
                  </Box>
                </Tooltip>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, v) => setPage(v)}
                size="small"
                sx={{
                  '& .MuiPaginationItem-root': { color: 'text.secondary' },
                  '& .Mui-selected': { bgcolor: 'rgba(255,255,255,0.1) !important', color: 'text.primary' },
                }}
              />
            </Box>
          )}
        </>
      )}

      {/* Full-size image lightbox */}
      <AlertLightbox
        alert={lightboxAlert}
        cameraName={lightboxCamera}
        onClose={() => setLightboxAlert(null)}
      />

      {/* Action / notification snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
