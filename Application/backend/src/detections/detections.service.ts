import { Injectable } from '@nestjs/common';
import { CreateDetectionDto } from './dto/create-detection.dto';
import { CamerasService } from '../cameras/cameras.service';
import { EventsGateway } from '../websocket/events.gateway';
import { AlertsService } from '../alerts/alerts.service';
import { calculateRiskLevel } from '../common/utils/risk-level.util';

/**
 * DetectionsService orchestrates everything that happens when the Python
 * worker sends a new frame detection to NestJS.
 *
 * Full flow per incoming detection:
 *
 *  Python worker
 *      │
 *      │  POST /detections  (JSON payload)
 *      ▼
 *  DetectionsController  →  DetectionsService.processDetection()
 *      │
 *      ├─── 1. Calculate risk level from detections
 *      │
 *      ├─── 2. Update camera.latestDetection in MongoDB  (overwrites previous)
 *      │
 *      ├─── 3. Emit 'detection:new' to camera room via Socket.IO
 *      │         Only clients subscribed to this camera receive the event.
 *      │
 *      └─── 4. Pass to AlertsService.checkAndCreateAlert()  (skeleton for now)
 */
@Injectable()
export class DetectionsService {
  constructor(
    private readonly camerasService: CamerasService,
    private readonly eventsGateway: EventsGateway,
    private readonly alertsService: AlertsService,
  ) {}

  /**
   * Process a detection payload sent by the Python worker.
   *
   * @param dto  The validated CreateDetectionDto from the HTTP request body
   */
  async processDetection(dto: CreateDetectionDto): Promise<{ ok: boolean }> {
    // ── Step 1: Calculate risk level ────────────────────────────────────────
    // The risk level is derived from the confidence scores of the detections.
    // We calculate it here so we can store it in MongoDB and send it over WS.
    const riskLevel = calculateRiskLevel(dto.detections ?? []);

    // ── Step 2: Build the latestDetection object ─────────────────────────────
    const latestDetection = {
      timestamp: dto.timestamp,
      snapshotUrl: dto.snapshotUrl,
      detections: dto.detections ?? [],
      riskLevel,
      videoTimestampMs: dto.videoTimestampMs,
    };

    // ── Step 3: Persist to MongoDB ───────────────────────────────────────────
    // updateLatestDetection overwrites the embedded latestDetection field.
    // We do NOT store a history of every frame — only the most recent result.
    await this.camerasService.updateLatestDetection(dto.cameraId, latestDetection);

    console.log(
      `[Detections] Camera ${dto.cameraId} — risk: ${riskLevel}, ` +
        `objects: ${(dto.detections ?? []).length}`,
    );

    // ── Step 4: Emit to WebSocket room ───────────────────────────────────────
    // This pushes the update in real-time to any frontend clients that have
    // subscribed to this camera's room (socket.emit('subscribe', [cameraId])).
    this.eventsGateway.emitDetectionToRoom(dto.cameraId, {
      cameraId: dto.cameraId,
      timestamp: dto.timestamp,
      snapshotUrl: dto.snapshotUrl,
      detections: dto.detections ?? [],
      riskLevel,
      videoTimestampMs: dto.videoTimestampMs,
    });

    // ── Step 5: Alert check (skeleton) ───────────────────────────────────────
    // AlertsService.checkAndCreateAlert() is a no-op for now.
    // Full alert logic (consecutive frame tracking, snapshot copy, DB insert)
    // will be implemented in a future sprint.
    await this.alertsService.checkAndCreateAlert(
      dto.cameraId,
      dto.detections ?? [],
      riskLevel,
      dto.snapshotUrl,  // snapshotPath — Python saved the file, we pass the URL path here
      dto.timestamp,
    );

    return { ok: true };
  }
}
