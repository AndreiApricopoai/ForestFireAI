export type CameraSourceType = 'local_video' | 's3_video' | 'rtsp' | 'drone_stream';
export type CameraStatus = 'active' | 'inactive' | 'error';
export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface Detection {
  class: 'fire' | 'smoke';
  confidence: number;
  bbox: [number, number, number, number];
}

/**
 * The latest YOLO result stored inside a Camera document.
 * Embedded — gets overwritten on every detection from Python.
 * cameraId is added on the frontend side (not stored in the embedded doc).
 */
export interface LatestDetection {
  cameraId: string;
  timestamp: string;
  videoTimestampMs: number;
  snapshotUrl: string | null;
  detections: Detection[];
  riskLevel: RiskLevel;
}

/**
 * Camera document as returned by GET /cameras or GET /cameras/:id.
 * Matches the NestJS CameraSchema with toJSON transform applied.
 */
export interface Camera {
  id: string;
  name: string;
  location: string;
  region: string;
  /** Filename of the video inside the cameras/ folder, e.g. "camera1.mp4" */
  sourceUrl: string;
  /** sourceType is a frontend-only concept kept for legacy compatibility */
  sourceType?: CameraSourceType;
  isActive: boolean;
  status: CameraStatus;
  analysisIntervalSeconds: number;
  confidenceThreshold: number;
  createdAt: string;
  updatedAt: string;
  /**
   * The latest detection embedded in the camera document.
   * Populated by the backend after the first Python worker POST.
   * null until the first detection arrives.
   */
  latestDetection: Omit<LatestDetection, 'cameraId'> | null;
}

export interface CamerasState {
  cameras: Camera[];
  latestDetections: Record<string, LatestDetection>;
  isLoading: boolean;
  error: string | null;
}
