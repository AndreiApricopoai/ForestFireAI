import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Alert, AlertDocument } from './schemas/alert.schema';

/**
 * AlertsService — skeleton implementation.
 *
 * This service is called by DetectionsService on every incoming frame result.
 * Right now it only logs when risk is high — the full decision logic will be
 * added in a later sprint.
 *
 * Planned alert rules (to be implemented):
 *   - fire confidence >= 0.60 in at least 2 consecutive frames → create alert
 *   - smoke confidence >= 0.70 in at least 2 consecutive frames → create alert
 *   - Risk level 'critical' → create alert immediately (single frame)
 *   - Copy the annotated snapshot to the alerts/ folder with a timestamp filename
 *   - Store the Alert document in MongoDB
 *   - Emit an 'alert:new' event via WebSocket to notify all connected users
 */
@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
  ) {}

  /**
   * Analyse the latest detection result and decide whether to create a new alert.
   *
   * Called by DetectionsService after every frame processed by the Python worker.
   *
   * @param cameraId      - ID of the camera that produced this detection
   * @param detections    - list of detected objects in the frame
   * @param riskLevel     - pre-calculated risk level string
   * @param snapshotPath  - absolute local path to the annotated snapshot image
   * @param timestamp     - ISO 8601 timestamp of the detection
   */
  async checkAndCreateAlert(
    cameraId: string,
    detections: Array<{ class: string; confidence: number; bbox: number[] }>,
    riskLevel: string,
    snapshotPath: string,
    timestamp: string,
  ): Promise<void> {
    // -----------------------------------------------------------------------
    // TODO: Implement consecutive-frame tracking per camera.
    //
    // The logic below is a placeholder that just logs high-risk events.
    // When fully implemented this method should:
    //   1. Track how many consecutive frames for this camera had fire/smoke.
    //   2. If the threshold is met, copy the snapshot to the alerts/ folder.
    //   3. Create an Alert document in MongoDB.
    //   4. Emit an 'alert:new' WebSocket event to all connected clients.
    // -----------------------------------------------------------------------

    if (riskLevel === 'critical' || riskLevel === 'high') {
      console.log(
        `[Alerts] ⚠ High risk detected — camera: ${cameraId}, level: ${riskLevel}, ` +
          `detections: ${detections.length}. Alert logic pending implementation.`,
      );
    }

    // Suppress unused-variable warnings until the implementation is complete
    void snapshotPath;
    void timestamp;
  }

  /**
   * Return all alerts from the database.
   * Will be exposed via GET /alerts once the controller is added.
   */
  async findAll(): Promise<Alert[]> {
    return this.alertModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Return alerts for a specific camera, newest first.
   */
  async findByCameraId(cameraId: string): Promise<Alert[]> {
    return this.alertModel
      .find({ cameraId })
      .sort({ createdAt: -1 })
      .exec();
  }
}
