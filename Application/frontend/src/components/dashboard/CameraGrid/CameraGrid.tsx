import { Grid, Typography, Box, CircularProgress } from '@mui/material';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CameraCard from '../CameraCard/CameraCard';
import type { Camera, LatestDetection } from '../../../types/camera.types';

interface Props {
  cameras: Camera[];
  latestDetections: Record<string, LatestDetection>;
  isLoading: boolean;
}

export default function CameraGrid({ cameras, latestDetections, isLoading }: Props) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (cameras.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
        <VideocamOffIcon sx={{ fontSize: 64, color: 'rgba(76,175,80,0.2)' }} />
        <Typography color="text.secondary">No cameras configured yet.</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {cameras.map((camera) => {
        const detection = latestDetections[camera.id];
        const topDetection = detection?.detections?.[0];
        return (
          <Grid key={camera.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <CameraCard
              id={camera.id}
              name={camera.name}
              location={camera.location}
              isActive={camera.isActive}
              videoSrc={camera.sourceType === 'local_video' ? camera.sourceUrl : undefined}
              riskLevel={detection?.riskLevel ?? 'none'}
              confidence={topDetection?.confidence}
              lastSeen={detection?.timestamp
                ? new Date(detection.timestamp).toLocaleTimeString()
                : undefined}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}
