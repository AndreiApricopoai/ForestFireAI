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
import { useEffect, useRef, useState } from 'react';
import type { RiskLevel } from '../../../types/camera.types';

interface Props {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  videoSrc?: string;
  riskLevel?: RiskLevel;
  confidence?: number;
  lastSeen?: string;
}

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

export default function CameraCard({
  name,
  location,
  isActive,
  videoSrc,
  riskLevel = 'none',
  confidence,
  lastSeen,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frameSrc, setFrameSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!videoSrc || !isActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    video.src = videoSrc;
    video.muted = true;
    video.preload = 'auto';

    const captureFrame = () => {
      if (video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setFrameSrc(canvas.toDataURL('image/jpeg', 0.8));
        video.currentTime = (video.currentTime + 5) % (video.duration || 60);
      }
    };

    video.addEventListener('loadeddata', captureFrame);
    video.addEventListener('seeked', captureFrame);

    const interval = setInterval(() => {
      if (video.duration) {
        video.currentTime = (video.currentTime + 5) % video.duration;
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      video.removeEventListener('loadeddata', captureFrame);
      video.removeEventListener('seeked', captureFrame);
    };
  }, [videoSrc, isActive]);

  const riskColor = RISK_COLORS[riskLevel];
  const isCritical = riskLevel === 'critical' || riskLevel === 'high';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        outline: isCritical ? `2px solid ${riskColor}` : 'none',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 24px rgba(0,0,0,0.4)`,
        },
      }}
    >
      <Box sx={{ position: 'relative', bgcolor: '#000', aspectRatio: '16/9' }}>
        {frameSrc ? (
          <CardMedia
            component="img"
            image={frameSrc}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#0d1a0d',
              minHeight: 160,
            }}
          >
            <VideocamIcon sx={{ fontSize: 48, color: 'rgba(76,175,80,0.3)' }} />
          </Box>
        )}

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

        {isCritical && (
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <LocalFireDepartmentIcon sx={{ color: riskColor, fontSize: 22 }} />
          </Box>
        )}

        <video ref={videoRef} style={{ display: 'none' }} crossOrigin="anonymous" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </Box>

      <CardContent sx={{ flex: 1, p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {location}
        </Typography>

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
          {confidence !== undefined && (
            <Typography variant="caption" color="text.secondary">
              {(confidence * 100).toFixed(0)}%
            </Typography>
          )}
        </Box>

        {confidence !== undefined && (
          <LinearProgress
            variant="determinate"
            value={confidence * 100}
            sx={{
              mt: 0.75,
              height: 3,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': { bgcolor: riskColor },
            }}
          />
        )}

        {lastSeen && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {lastSeen}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
