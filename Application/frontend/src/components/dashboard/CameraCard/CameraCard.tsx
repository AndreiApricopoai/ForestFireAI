import {
  Card,
  CardContent,
  CardMedia,
  Box,
  Typography,
  Chip,
  LinearProgress,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import type { RiskLevel } from '../../../types/camera.types';

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

interface Props {
  id: string;
  name: string;
  location: string;
  region?: string;
  isActive: boolean;
  /** Path returned by the backend, e.g. "/snapshots/<id>_latest.jpg" */
  snapshotUrl?: string | null;
  /**
   * ISO timestamp of the latest detection.
   * Used as a URL cache-buster so the browser fetches the new JPEG
   * every time a detection arrives instead of showing a cached copy.
   */
  lastUpdated?: string;
  riskLevel?: RiskLevel;
  /** Highest confidence among all detections in the latest frame */
  maxConfidence?: number;
  /** Total number of boxes detected in the latest frame */
  detectionCount?: number;
  /** Called when the user clicks the card to open the detail dialog */
  onClick?: () => void;
}

export default function CameraCard({
  id: _id,
  name,
  location,
  region,
  isActive,
  snapshotUrl,
  lastUpdated,
  riskLevel = 'none',
  maxConfidence,
  detectionCount,
  onClick,
}: Props) {
  const riskColor = RISK_COLORS[riskLevel];
  const isCritical = riskLevel === 'critical' || riskLevel === 'high';

  /**
   * Build the full URL for the annotated snapshot image.
   *
   * The snapshotUrl from the backend is a path like "/snapshots/<id>_latest.jpg".
   * Prepend the API base URL so the browser can fetch it from NestJS.
   *
   * Append ?t=<timestamp> as a cache-buster: browsers cache images aggressively
   * by URL. Every time a new detection arrives, lastUpdated changes, which changes
   * the URL, which forces a fresh fetch even though the filename is always the same.
   */
  const imageUrl = snapshotUrl
    ? `${API_URL}${snapshotUrl}?t=${lastUpdated ?? Date.now()}`
    : null;

  /**
   * Format the lastUpdated timestamp into a human-readable "last seen" string.
   * Shows only the time portion (HH:MM:SS) since detections are recent.
   */
  const lastSeenLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString()
    : null;

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        outline: isCritical ? `2px solid ${riskColor}` : 'none',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
        },
      }}
    >
      {/* ── Image area ── */}
      <Box sx={{ position: 'relative', bgcolor: '#000', aspectRatio: '16/9' }}>
        {imageUrl ? (
          <CardMedia
            component="img"
            image={imageUrl}
            alt={`${name} latest snapshot`}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          /* Placeholder shown before the first detection arrives */
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              bgcolor: '#0d1a0d',
              minHeight: 160,
            }}
          >
            <VideocamIcon sx={{ fontSize: 40, color: 'rgba(76,175,80,0.3)' }} />
            <Typography variant="caption" color="rgba(255,255,255,0.2)">
              Waiting for snapshot…
            </Typography>
          </Box>
        )}

        {/* LIVE / OFFLINE badge */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.5 }}>
          <Chip
            size="small"
            label={isActive ? 'LIVE' : 'OFFLINE'}
            sx={{
              height: 20,
              fontSize: 10,
              fontWeight: 700,
              bgcolor: isActive ? 'rgba(76,175,80,0.85)' : 'rgba(100,100,100,0.85)',
              color: '#fff',
            }}
          />
        </Box>

        {/* Fire icon badge for high / critical risk */}
        {isCritical && (
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <LocalFireDepartmentIcon sx={{ color: riskColor, fontSize: 22 }} />
          </Box>
        )}

        {/* Detection count badge — shown when YOLO found at least one object */}
        {detectionCount !== undefined && detectionCount > 0 && (
          <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
            <Chip
              size="small"
              label={`${detectionCount} obj`}
              sx={{
                height: 18,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: riskColor,
                border: `1px solid ${riskColor}66`,
              }}
            />
          </Box>
        )}
      </Box>

      {/* ── Info area ── */}
      <CardContent sx={{ flex: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {name}
        </Typography>

        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {region ? `${location} · ${region}` : location}
        </Typography>

        {/* Risk level chip + confidence percentage */}
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            label={RISK_LABELS[riskLevel]}
            size="small"
            sx={{
              height: 18,
              fontSize: 10,
              fontWeight: 700,
              bgcolor: `${riskColor}22`,
              color: riskColor,
              border: `1px solid ${riskColor}55`,
            }}
          />
          {maxConfidence !== undefined && (
            <Typography variant="caption" color="text.secondary">
              {(maxConfidence * 100).toFixed(0)}%
            </Typography>
          )}
        </Box>

        {/* Confidence bar */}
        {maxConfidence !== undefined && (
          <LinearProgress
            variant="determinate"
            value={maxConfidence * 100}
            sx={{
              mt: 0.75,
              height: 3,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': { bgcolor: riskColor },
            }}
          />
        )}

        {/* Last seen timestamp */}
        {lastSeenLabel && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Last: {lastSeenLabel}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
