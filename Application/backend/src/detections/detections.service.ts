import { Injectable } from '@nestjs/common';
import { CreateDetectionDto } from './dto/create-detection.dto';
import { CamerasService } from '../cameras/cameras.service';
import { EventsGateway } from '../websocket/events.gateway';
import { AlertsService } from '../alerts/alerts.service';
import { calculateRiskLevel } from '../common/utils/risk-level.util';

@Injectable()
export class DetectionsService {
  constructor(
    private readonly camerasService: CamerasService,
    private readonly eventsGateway: EventsGateway,
    private readonly alertsService: AlertsService,
  ) {}

  async processDetection(dto: CreateDetectionDto): Promise<{ ok: boolean }> {

    const riskLevel = calculateRiskLevel(dto.detections ?? []);

    const latestDetection = {
      timestamp: dto.timestamp,
      snapshotUrl: dto.snapshotUrl,
      detections: dto.detections ?? [],
      riskLevel,
      videoTimestampMs: dto.videoTimestampMs,
    };

    await this.camerasService.updateLatestDetection(dto.cameraId, latestDetection);

    console.log(
      `[Detections] Camera ${dto.cameraId} — risk: ${riskLevel}, ` +
        `objects: ${(dto.detections ?? []).length}`,
    );

    this.eventsGateway.emitDetectionToRoom(dto.cameraId, {
      cameraId: dto.cameraId,
      timestamp: dto.timestamp,
      snapshotUrl: dto.snapshotUrl,
      detections: dto.detections ?? [],
      riskLevel,
      videoTimestampMs: dto.videoTimestampMs,
    });

    await this.alertsService.checkAndCreateAlert(
      dto.cameraId,
      dto.detections ?? [],
      riskLevel,
      dto.snapshotUrl, 
      dto.timestamp,
    );

    return { ok: true };
  }
}
