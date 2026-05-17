import type { Camera } from '../../types/camera.types';

export interface CreateCameraRequest {
  name: string;
  location: string;
  region?: string;
  /** Filename of the video inside the cameras/ folder, e.g. "camera1.mp4" */
  sourceUrl: string;
  isActive?: boolean;
  analysisIntervalSeconds?: number;
  confidenceThreshold?: number;
}

export interface UpdateCameraRequest extends Partial<CreateCameraRequest> {}

export type CameraListResponse = Camera[];
export type CameraResponse = Camera;
