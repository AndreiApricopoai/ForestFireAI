import { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  CircularProgress,
  TextField,
  InputAdornment,
  Pagination,
} from '@mui/material';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import SearchIcon from '@mui/icons-material/Search';
import CameraCard from '../CameraCard/CameraCard';
import type { Camera, LatestDetection } from '../../../types/camera.types';

const PAGE_SIZE = 10;

interface Props {
  cameras: Camera[];
  latestDetections: Record<string, LatestDetection>;
  isLoading: boolean;
  onVisibleCamerasChange: (cameraIds: string[]) => void;
  onCameraClick: (camera: Camera) => void;
}

export default function CameraGrid({
  cameras,
  latestDetections,
  isLoading,
  onVisibleCamerasChange,
  onCameraClick,
}: Props) {
  const [filterText, setFilterText] = useState('');
  const [page, setPage] = useState(1);

  const filteredCameras = cameras.filter((cam) => {
    if (!filterText.trim()) return true;
    const query = filterText.toLowerCase();
    return (
      cam.name.toLowerCase().includes(query) ||
      cam.location.toLowerCase().includes(query) ||
      (cam.region ?? '').toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    setPage(1);
  }, [filterText]);

  const totalPages = Math.max(1, Math.ceil(filteredCameras.length / PAGE_SIZE));

  const paginated = filteredCameras.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    onVisibleCamerasChange(paginated.map((cam) => cam.id));

  }, [paginated.map((c) => c.id).join(','), onVisibleCamerasChange]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box>
      {}
      <Box sx={{ mb: 2 }}>
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
      </Box>

      {}
      {cameras.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
          <VideocamOffIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.1)' }} />
          <Typography color="text.secondary">No cameras configured yet.</Typography>
        </Box>
      )}

      {}
      {cameras.length > 0 && filteredCameras.length === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 1 }}>
          <VideocamOffIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)' }} />
          <Typography color="text.secondary">
            No cameras match &quot;{filterText}&quot;
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Try a different name, location, or region.
          </Typography>
        </Box>
      )}

      {}
      {paginated.length > 0 && (
        <Grid container spacing={2}>
          {paginated.map((camera) => {
            const detection = latestDetections[camera.id];

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
                  onClick={() => onCameraClick(camera)}
                />
              </Grid>
            );
          })}
        </Grid>
      )}

      {}
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
    </Box>
  );
}
