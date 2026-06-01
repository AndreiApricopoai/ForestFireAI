import apiClient from '../client';
import type { AlertRecord, AlertStatus } from '../../types/alert.types';

export const alertsApi = {

  getAll: () => apiClient.get<AlertRecord[]>('/alerts'),

  getByCameraId: (cameraId: string) =>
    apiClient.get<AlertRecord[]>(`/alerts?cameraId=${cameraId}`),

  updateStatus: (id: string, status: AlertStatus, note?: string) =>
    apiClient.patch<AlertRecord>(`/alerts/${id}`, { status, note }),
};
