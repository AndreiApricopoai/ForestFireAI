import apiClient from '../client';
import type {
  CameraListResponse,
  CameraResponse,
  CreateCameraRequest,
  UpdateCameraRequest,
} from './cameras.types';

export const camerasApi = {
  getAll: () => apiClient.get<CameraListResponse>('/cameras'),

  getById: (id: string) => apiClient.get<CameraResponse>(`/cameras/${id}`),

  create: (payload: CreateCameraRequest) =>
    apiClient.post<CameraResponse>('/cameras', payload),

  update: (id: string, payload: UpdateCameraRequest) =>
    apiClient.patch<CameraResponse>(`/cameras/${id}`, payload),

  remove: (id: string) => apiClient.delete(`/cameras/${id}`),
};
