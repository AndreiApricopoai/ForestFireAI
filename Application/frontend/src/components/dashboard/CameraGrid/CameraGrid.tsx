import { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import SearchIcon from '@mui/icons-material/Search';
import CameraCard from '../CameraCard/CameraCard';
import type { Camera, LatestDetection } from '../../../types/camera.types';

interface Props {
  cameras: Camera[];
  latestDetections: Record<string, LatestDetection>;
  isLoading: boolean;
  /**
   * Callback from the parent (DashboardPage) that holds the socket connection.
   * CameraGrid calls this whenever the set of visible cameras changes so the
   * socket subscribes/unsubscribes from the right rooms.
   */
  onVisibleCamerasChange: (cameraIds: string[]) => void;
}

export default function CameraGrid({
  cameras,
  latestDetections,
  isLoading,
  onVisibleCamerasChange,
}: Props) {
  // Local filter state — controlled by the search input
  const [filterText, setFilterText] = useState('');

  /**
   * Derive the filtered list from the full cameras array + current filter.
   * Matching is case-insensitive and checks name, location, and region.
   */
  const filteredCameras = cameras.filter((cam) => {
    if (!filterText.trim()) return true;
    const query = filterText.toLowerCase();
    return (
      cam.name.toLowerCase().includes(query) ||
      cam.location.toLowerCase().includes(query) ||
      (cam.region ?? '').toLowerCase().includes(query)
    );
  });

  /**
   * Whenever the filtered list changes, tell the parent which camera IDs are
   * currently visible. The parent socket hook will then diff this list against
   * the previously subscribed set and send subscribe/unsubscribe to NestJS.
   *
   * This runs on:
   *   - Initial mount (subscribes to all visible cameras)
   *   - Every time the user types in the filter input
   *   - Every time the cameras array changes (e.g. after initial API fetch)
   */
  useEffect(() => {
    onVisibleCamerasChange(filteredCameras.map((cam) => cam.id));
  }, [filteredCameras, onVisibleCamerasChange]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Filter bar ── */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          size="small"
          placeholder="Filter by name, location or region…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ width: 320 }}
        />
        <Typography variant="body2" color="text.secondary">
          {filteredCameras.length === cameras.length
            ? `${cameras.length} camera${cameras.length !== 1 ? 's' : ''}`
            : `${filteredCameras.length} of ${cameras.length}`}
        </Typography>
      </Box>

      {/* ── No cameras at all ── */}
      {cameras.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
          <VideocamOffIcon sx={{ fontSize: 64, color: 'rgba(76,175,80,0.2)' }} />
          <Typography color="text.secondary">No cameras configured yet.</Typography>
        </Box>
      )}

      {/* ── Filter returned no results ── */}
      {cameras.length > 0 && filteredCameras.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1 }}>
          <VideocamOffIcon sx={{ fontSize: 48, color: 'rgba(76,175,80,0.2)' }} />
          <Typography color="text.secondary">
            No cameras match &quot;{filterText}&quot;
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Try a different name, location, or region.
          </Typography>
        </Box>
      )}

      {/* ── Camera grid ── */}
      {filteredCameras.length > 0 && (
        <Grid container spacing={2}>
          {filteredCameras.map((camera) => {
            const detection = latestDetections[camera.id];

            // Find the single detection with the highest confidence
            const topDetection = detection?.detections?.reduce(
              (best, d) => (d.confidence > (best?.confidence ?? 0) ? d : best),
              detection.detections[0],
            );

            return (
              <Grid key={camera.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <CameraCard
                  id={camera.id}
                  name={camera.name}
                  location={camera.location}
                  region={camera.region}
                  isActive={camera.isActive}
                  snapshotUrl={detection?.snapshotUrl ?? camera.latestDetection?.snapshotUrl}
                  lastUpdated={detection?.timestamp ?? camera.latestDetection?.timestamp}
                  riskLevel={detection?.riskLevel ?? camera.latestDetection?.riskLevel ?? 'none'}
                  maxConfidence={topDetection?.confidence}
                  detectionCount={detection?.detections?.length ?? camera.latestDetection?.detections?.length}
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
