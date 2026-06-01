import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Alert, AlertDocument } from './schemas/alert.schema';
import { EventsGateway } from '../websocket/events.gateway';

@Injectable()
export class AlertsService {

  private readonly FIRE_THRESHOLD = 0.7;

  private readonly SMOKE_THRESHOLD = 0.7;

  private readonly COOLDOWN_MS = 5 * 60 * 1000;

  private readonly lastAlertTime = new Map<string, number>();

  constructor(
    @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
    private readonly eventsGateway: EventsGateway,
    private readonly configService: ConfigService,
  ) {}

  async checkAndCreateAlert(
    cameraId: string,
    detections: Array<{ class: string; confidence: number; bbox: number[] }>,
    riskLevel: string,
    snapshotUrl: string,
    timestamp: string,
  ): Promise<void> {

    const maxFire = detections
      .filter((d) => d.class === 'fire')
      .reduce((max, d) => Math.max(max, d.confidence), 0);

    const maxSmoke = detections
      .filter((d) => d.class === 'smoke')
      .reduce((max, d) => Math.max(max, d.confidence), 0);

    const fireTrigger = maxFire >= this.FIRE_THRESHOLD;
    const smokeTrigger = maxSmoke >= this.SMOKE_THRESHOLD;

    if (!fireTrigger && !smokeTrigger) {
      return;
    }

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

    let type: 'fire' | 'smoke' | 'fire_and_smoke';
    if (fireTrigger && smokeTrigger) {
      type = 'fire_and_smoke';
    } else if (fireTrigger) {
      type = 'fire';
    } else {
      type = 'smoke';
    }

    const maxConfidence = Math.max(maxFire, maxSmoke);

    const alertSnapshotUrl = await this.saveAlertImage(cameraId, timestamp);

    const alert = await this.alertModel.create({
      cameraId,
      detectionTimestamp: timestamp,
      type,
      maxConfidence,
      riskLevel,
      alertSnapshotUrl,
      status: 'pending',
    });

    this.lastAlertTime.set(cameraId, now);

    console.log(
      `[Alerts] NEW ALERT — camera: ${cameraId}, type: ${type}, ` +
        `confidence: ${(maxConfidence * 100).toFixed(0)}%, risk: ${riskLevel}`,
    );

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

    void snapshotUrl;
  }

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

    await fs.mkdir(cameraAlertDir, { recursive: true });

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

      return `/snapshots/${cameraId}_latest.jpg`;
    }

    return `/alerts/${cameraId}/${destFilename}`;
  }

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
