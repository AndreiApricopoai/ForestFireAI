import apiClient from '../client';
import type { DetectionHistoryRequest, DetectionListResponse, DetectionResponse } from './detections.types';

export const detectionsApi = {
  getLatest: (cameraId: string) =>
    apiClient.get<DetectionResponse>(`/detections/latest/${cameraId}`),

  getHistory: (params: DetectionHistoryRequest) =>
    apiClient.get<DetectionListResponse>('/detections', { params }),
};
