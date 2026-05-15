export type CameraSourceType = 'local_video' | 's3_video' | 'rtsp' | 'drone_stream';
export type CameraStatus = 'active' | 'inactive' | 'error';
export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface Detection {
  class: 'fire' | 'smoke';
  confidence: number;
  bbox: [number, number, number, number];
}

export interface Camera {
  id: string;
  name: string;
  sourceType: CameraSourceType;
  sourceUrl: string;
  location: string;
  isActive: boolean;
  status: CameraStatus;
  analysisIntervalSeconds: number;
  confidenceThreshold: number;
  createdAt: string;
}

export interface LatestDetection {
  cameraId: string;
  timestamp: string;
  videoTimestampMs: number;
  snapshotUrl: string | null;
  detections: Detection[];
  riskLevel: RiskLevel;
}

export interface CamerasState {
  cameras: Camera[];
  latestDetections: Record<string, LatestDetection>;
  isLoading: boolean;
  error: string | null;
}
