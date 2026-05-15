import type { Camera, CameraSourceType } from '../../types/camera.types';

export interface CreateCameraRequest {
  name: string;
  sourceType: CameraSourceType;
  sourceUrl: string;
  location: string;
  analysisIntervalSeconds?: number;
  confidenceThreshold?: number;
}

export interface UpdateCameraRequest extends Partial<CreateCameraRequest> {
  isActive?: boolean;
}

export type CameraListResponse = Camera[];
export type CameraResponse = Camera;
