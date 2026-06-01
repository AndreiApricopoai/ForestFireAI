import type { Camera } from '../../types/camera.types';

export interface CreateCameraRequest {
  name: string;
  location: string;
  region?: string;

  sourceUrl: string;
  isActive?: boolean;
  analysisIntervalSeconds?: number;
  confidenceThreshold?: number;
}

export interface UpdateCameraRequest extends Partial<CreateCameraRequest> {}

export type CameraListResponse = Camera[];
export type CameraResponse = Camera;
