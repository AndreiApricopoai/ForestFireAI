import type { LatestDetection } from '../../types/camera.types';

export interface DetectionHistoryRequest {
  cameraId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export type DetectionResponse = LatestDetection;
export type DetectionListResponse = LatestDetection[];
