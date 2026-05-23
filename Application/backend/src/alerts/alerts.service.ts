import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Alert, AlertDocument } from './schemas/alert.schema';
import { EventsGateway } from '../websocket/events.gateway';

/**
 * AlertsService — full implementation of the alert threshold system.
 *
 * Called by DetectionsService on every incoming frame result.
 *
 * Alert rules:
 *   - Fire confidence   >= 0.70  in a frame → trigger alert
 *   - Smoke confidence  >= 0.70  in a frame → trigger alert
 *
 * Cooldown:
 *   - Once an alert is created for a camera, no new alert is created
 *     for that same camera for the next 5 minutes.
 *   - This prevents alert flooding when a fire persists over many frames.
 *
 * On alert creation:
 *   1. Copy the latest snapshot to alerts/<cameraId>/<timestamp>.jpg
 *   2. Insert an Alert document into MongoDB
 *   3. Emit 'alert:new' via Socket.IO to all admins currently connected
 */
@Injectable()
export class AlertsService {
  /** Minimum fire confidence to create an alert */
  private readonly FIRE_THRESHOLD = 0.7;
  /** Minimum smoke confidence to create an alert */
  private readonly SMOKE_THRESHOLD = 0.7;
  /** Minimum ms between alerts for the same camera (5 minutes) */
  private readonly COOLDOWN_MS = 5 * 60 * 1000;

  /**
   * In-memory map: cameraId → epoch ms of the last alert created.
   * Resets when the server restarts. For a production system this
   * would live in Redis, but in-memory is sufficient for now.
   */
  private readonly lastAlertTime = new Map<string, number>();

  constructor(
    @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
    private readonly eventsGateway: EventsGateway,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Main entry point — called by DetectionsService on every frame result.
   *
   * @param cameraId   MongoDB ID of the camera
   * @param detections List of YOLO detections for this frame
   * @param riskLevel  Pre-calculated risk level string
   * @param snapshotUrl The URL path served by NestJS, e.g. "/snapshots/<id>_latest.jpg"
   * @param timestamp  ISO 8601 timestamp of the detection
   */
  async checkAndCreateAlert(
    cameraId: string,
    detections: Array<{ class: string; confidence: number; bbox: number[] }>,
    riskLevel: string,
    snapshotUrl: string,
    timestamp: string,
  ): Promise<void> {
    // ── Step 1: Check confidence thresholds ─────────────────────────────────
    const maxFire = detections
      .filter((d) => d.class === 'fire')
      .reduce((max, d) => Math.max(max, d.confidence), 0);

    const maxSmoke = detections
      .filter((d) => d.class === 'smoke')
      .reduce((max, d) => Math.max(max, d.confidence), 0);

    const fireTrigger = maxFire >= this.FIRE_THRESHOLD;
    const smokeTrigger = maxSmoke >= this.SMOKE_THRESHOLD;

    if (!fireTrigger && !smokeTrigger) {
      return; // Nothing above threshold — no alert
    }

    // ── Step 2: Check 5-minute cooldown per camera ───────────────────────────
    const now = Date.now();
    const lastTime = this.lastAlertTime.get(cameraId) ?? 0;
    const elapsed = now - lastTime;

    if (elapsed < this.COOLDOWN_MS) {
      const remainingMin = Math.ceil((this.COOLDOWN_MS - elapsed) / 60000);
      console.log(
        `[Alerts] Camera ${cameraId}: cooldown active, next alert in ${remainingMin}m.`,
      );
      return;
    }

    // ── Step 3: Determine alert type ─────────────────────────────────────────
    let type: 'fire' | 'smoke' | 'fire_and_smoke';
    if (fireTrigger && smokeTrigger) {
      type = 'fire_and_smoke';
    } else if (fireTrigger) {
      type = 'fire';
    } else {
      type = 'smoke';
    }

    const maxConfidence = Math.max(maxFire, maxSmoke);

    // ── Step 4: Copy snapshot to alerts/<cameraId>/<timestamp>.jpg ───────────
    const alertSnapshotUrl = await this.saveAlertImage(cameraId, timestamp);

    // ── Step 5: Persist Alert to MongoDB ─────────────────────────────────────
    const alert = await this.alertModel.create({
      cameraId,
      detectionTimestamp: timestamp,
      type,
      maxConfidence,
      riskLevel,
      alertSnapshotUrl,
      status: 'pending',
    });

    // ── Step 6: Update cooldown ───────────────────────────────────────────────
    this.lastAlertTime.set(cameraId, now);

    console.log(
      `[Alerts] NEW ALERT — camera: ${cameraId}, type: ${type}, ` +
        `confidence: ${(maxConfidence * 100).toFixed(0)}%, risk: ${riskLevel}`,
    );

    // ── Step 7: Emit to all admin clients via WebSocket ──────────────────────
    const alertPlain = (alert as unknown as { toJSON(): Record<string, unknown> }).toJSON();
    this.eventsGateway.emitNewAlert({
      id: alertPlain.id as string,
      cameraId,
      detectionTimestamp: timestamp,
      type,
      maxConfidence,
      riskLevel,
      alertSnapshotUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    // Suppress unused param warning (kept in signature for compatibility)
    void snapshotUrl;
  }

  /**
   * Copy the latest annotated snapshot for a camera into a dedicated
   * per-camera alerts folder and return the URL path NestJS serves it at.
   *
   * Source:       <SNAPSHOTS_FOLDER>/<cameraId>_latest.jpg
   * Destination:  <ALERTS_FOLDER>/<cameraId>/<epochMs>.jpg
   * Served at:    /alerts/<cameraId>/<epochMs>.jpg
   */
  private async saveAlertImage(
    cameraId: string,
    timestamp: string,
  ): Promise<string> {
    const snapshotsFolder = path.resolve(
      process.cwd(),
      this.configService.get<string>('SNAPSHOTS_FOLDER') ?? '../snapshots',
    );
    const alertsFolder = path.resolve(
      process.cwd(),
      this.configService.get<string>('ALERTS_FOLDER') ?? '../alerts',
    );

    const sourceFile = path.join(snapshotsFolder, `${cameraId}_latest.jpg`);
    const cameraAlertDir = path.join(alertsFolder, cameraId);

    // Create per-camera directory if it doesn't exist
    await fs.mkdir(cameraAlertDir, { recursive: true });

    // Use epoch ms as filename for uniqueness and chronological sorting
    const epochMs = new Date(timestamp).getTime() || Date.now();
    const destFilename = `${epochMs}.jpg`;
    const destFile = path.join(cameraAlertDir, destFilename);

    try {
      await fs.copyFile(sourceFile, destFile);
    } catch (err) {
      console.warn(
        `[Alerts] Could not copy snapshot for camera ${cameraId}:`,
        (err as Error).message,
      );
      // Fallback: reference the rolling snapshot directly
      return `/snapshots/${cameraId}_latest.jpg`;
    }

    // Return the URL path NestJS serves this file at via /alerts prefix
    return `/alerts/${cameraId}/${destFilename}`;
  }

  // ── Query methods ──────────────────────────────────────────────────────────

  async findAll(): Promise<Alert[]> {
    return this.alertModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByCameraId(cameraId: string): Promise<Alert[]> {
    return this.alertModel
      .find({ cameraId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(
    id: string,
    status: 'pending' | 'acknowledged' | 'resolved',
    note?: string,
  ): Promise<Alert | null> {
    const update: Record<string, unknown> = { status };
    if (note !== undefined) update.note = note;
    return this.alertModel
      .findByIdAndUpdate(id, update, { returnDocument: 'after' })
      .exec();
  }
}
