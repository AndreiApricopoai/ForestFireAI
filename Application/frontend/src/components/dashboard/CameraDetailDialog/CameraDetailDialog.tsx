import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  Tab,
  Tabs,
  IconButton,
  Divider,
  LinearProgress,
  Stack,
  CardMedia,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VideocamIcon from '@mui/icons-material/Videocam';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CloudIcon from '@mui/icons-material/Cloud';
import type { Camera, LatestDetection, RiskLevel } from '../../../types/camera.types';
import { useAppSelector } from '../../../hooks/useAppDispatch';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const RISK_COLORS: Record<RiskLevel, string> = {
  none: '#4caf50',
  low: '#8bc34a',
  medium: '#ff9800',
  high: '#f44336',
  critical: '#b71c1c',
};

const RISK_LABELS: Record<RiskLevel, string> = {
  none: 'Clear',
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'CRITICAL',
};

function filenameFromPath(fullPath: string): string {

  return fullPath.replace(/.*[/\\]/, '');
}

interface DetectionViewProps {
  detection: LatestDetection | null;
  camera: Camera;
}

function DetectionView({ detection, camera }: DetectionViewProps) {
  const riskLevel = (detection?.riskLevel ?? 'none') as RiskLevel;
  const riskColor = RISK_COLORS[riskLevel];

  const imageUrl = detection?.snapshotUrl
    ? `${API_URL}${detection.snapshotUrl}?t=${detection.timestamp ?? Date.now()}`
    : null;

  const topDetection = detection?.detections?.reduce(
    (best, d) => (d.confidence > (best?.confidence ?? 0) ? d : best),
    detection.detections[0],
  );

  return (
    <Box>
      {}
      <Box sx={{ position: 'relative', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
        {imageUrl ? (
          <CardMedia
            component="img"
            image={imageUrl}
            alt="Latest annotated frame"
            sx={{ width: '100%', maxHeight: '55vh', objectFit: 'contain' }}
          />
        ) : (
          <Box
            sx={{
              height: 300,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              bgcolor: '#0d1a0d',
            }}
          >
            <VideocamIcon sx={{ fontSize: 56, color: 'rgba(76,175,80,0.3)' }} />
            <Typography color="rgba(255,255,255,0.3)">
              Waiting for first snapshot…
            </Typography>
          </Box>
        )}

        {}
        <Box sx={{ position: 'absolute', top: 10, left: 10 }}>
          <Chip
            label={RISK_LABELS[riskLevel]}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: 11,
              bgcolor: `${riskColor}cc`,
              color: '#fff',
            }}
          />
        </Box>
      </Box>

      {}
      <Box sx={{ mt: 2 }}>
        <Stack direction="row" sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 140 }}>
            <Typography variant="caption" color="text.secondary">
              Max confidence
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: topDetection
                  ? topDetection.class === 'smoke' ? '#90a4ae' : '#f44336'
                  : 'text.primary',
              }}
            >
              {topDetection ? `${(topDetection.confidence * 100).toFixed(0)}%` : '—'}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 140 }}>
            <Typography variant="caption" color="text.secondary">
              Objects detected
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {detection?.detections?.length ?? 0}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="caption" color="text.secondary">
              Last updated
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {detection?.timestamp
                ? new Date(detection.timestamp).toLocaleTimeString()
                : 'No data yet'}
            </Typography>
          </Box>
        </Stack>

        {}
        {topDetection && (
          <LinearProgress
            variant="determinate"
            value={topDetection.confidence * 100}
            sx={{
              mb: 2,
              height: 6,
              borderRadius: 3,
              bgcolor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': {
                bgcolor: topDetection.class === 'smoke' ? '#90a4ae' : '#f44336',
              },
            }}
          />
        )}

        {}
        {detection?.detections && detection.detections.length > 0 && (
          <>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 1.5 }} />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              DETECTED OBJECTS
            </Typography>
            <Stack spacing={0.75}>
              {detection.detections.map((det, i) => {
                const isSmoke = det.class === 'smoke';
                const conf = (det.confidence * 100).toFixed(0);
                return (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 1,
                      bgcolor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {isSmoke ? (
                      <CloudIcon sx={{ fontSize: 16, color: '#90a4ae' }} />
                    ) : (
                      <LocalFireDepartmentIcon sx={{ fontSize: 16, color: '#f44336' }} />
                    )}
                    <Typography variant="body2" sx={{ textTransform: 'capitalize', flexGrow: 1 }}>
                      {det.class}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={det.confidence * 100}
                      sx={{
                        width: 80,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.06)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: isSmoke ? '#90a4ae' : '#f44336',
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32, textAlign: 'right' }}>
                      {conf}%
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}

interface LiveFeedProps {
  sourceUrl: string;

  startAtMs?: number;
}

function LiveFeed({ sourceUrl, startAtMs }: LiveFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const filename = filenameFromPath(sourceUrl);
  const videoUrl = `${API_URL}/cameras/${filename}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      if (startAtMs !== undefined && startAtMs > 0) {
        const targetSec = (startAtMs / 1000) % video.duration;
        video.currentTime = targetSec;
      }
      void video.play().catch(() => {

      });
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    return () => video.removeEventListener('loadedmetadata', handleLoaded);
  }, [startAtMs]);

  return (
    <Box>
      <Box
        sx={{
          position: 'relative',
          bgcolor: '#000',
          borderRadius: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          loop
          controls
          playsInline
          style={{ width: '100%', maxHeight: '55vh', display: 'block' }}
        />
      </Box>

    </Box>
  );
}

interface Props {
  camera: Camera | null;
  onClose: () => void;
}

export default function CameraDetailDialog({ camera, onClose }: Props) {
  const [tab, setTab] = useState(0);

  const latestDetections = useAppSelector((s) => s.cameras.latestDetections);
  const detection = camera ? (latestDetections[camera.id] ?? null) : null;

  useEffect(() => {
    if (camera) setTab(0);
  }, [camera?.id]);

  if (!camera) return null;

  const riskLevel = (detection?.riskLevel ?? 'none') as RiskLevel;
  const riskColor = RISK_COLORS[riskLevel];

  return (
    <Dialog
      open={!!camera}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'background.paper',
            border: '1px solid rgba(46,125,50,0.2)',
          },
        },
      }}
    >
      {}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          pb: 1,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <VideocamIcon sx={{ mt: 0.3, color: 'primary.light' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {camera.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {camera.region ? `${camera.location} · ${camera.region}` : camera.location}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            label={camera.isActive ? 'LIVE' : 'OFFLINE'}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: 10,
              bgcolor: camera.isActive ? 'rgba(76,175,80,0.2)' : 'rgba(100,100,100,0.2)',
              color: camera.isActive ? '#4caf50' : '#888',
              border: `1px solid ${camera.isActive ? '#4caf50' : '#888'}44`,
            }}
          />
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {}
      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        sx={{
          px: 2,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          '& .MuiTab-root': { fontSize: 13, fontWeight: 600, textTransform: 'none' },
        }}
      >
        <Tab label="Detection View" />
        <Tab label="Live Feed" />
      </Tabs>

      {}
      <DialogContent sx={{ pt: 2.5 }}>
        {tab === 0 && (
          <DetectionView detection={detection} camera={camera} />
        )}
        {tab === 1 && (
          <LiveFeed
            sourceUrl={camera.sourceUrl}
            startAtMs={detection?.videoTimestampMs ?? camera.latestDetection?.videoTimestampMs}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
