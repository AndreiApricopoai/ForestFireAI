export type AlertType = 'fire' | 'smoke' | 'fire_and_smoke';
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved';

export interface AlertRecord {
  id: string;
  cameraId: string;
  detectionTimestamp: string;
  type: AlertType;
  maxConfidence: number;
  riskLevel: string;
  alertSnapshotUrl: string;
  status: AlertStatus;
  note: string;
  createdAt: string;
}
