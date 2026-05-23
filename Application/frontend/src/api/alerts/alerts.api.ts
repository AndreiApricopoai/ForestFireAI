import apiClient from '../client';
import type { AlertRecord, AlertStatus } from '../../types/alert.types';

export const alertsApi = {
  /** Fetch all alerts, newest first (admin only) */
  getAll: () => apiClient.get<AlertRecord[]>('/alerts'),

  /** Fetch all alerts for a specific camera */
  getByCameraId: (cameraId: string) =>
    apiClient.get<AlertRecord[]>(`/alerts?cameraId=${cameraId}`),

  /** Update the status (and optional note) of an alert */
  updateStatus: (id: string, status: AlertStatus, note?: string) =>
    apiClient.patch<AlertRecord>(`/alerts/${id}`, { status, note }),
};
