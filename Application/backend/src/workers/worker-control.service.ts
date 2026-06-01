import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CameraPayload {
  id: string;
  name: string;
  sourceUrl: string;
  analysisIntervalSeconds: number;
  confidenceThreshold: number;
}

@Injectable()
export class WorkerControlService {
  private readonly workerUrl: string;

  private readonly TIMEOUT_MS = 5000;

  constructor(private readonly configService: ConfigService) {
    this.workerUrl =
      this.configService.get<string>('PYTHON_WORKER_URL') ??
      'http://localhost:8000';
  }

  async startWorker(camera: CameraPayload): Promise<void> {
    const url = `${this.workerUrl}/workers/${camera.id}/start`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(camera),
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (response.ok) {
        console.log(`[WorkerControl] Started worker for camera: ${camera.id}`);
      } else {
        console.warn(
          `[WorkerControl] Python worker returned ${response.status} for start(${camera.id})`,
        );
      }
    } catch (err) {

      console.warn(
        `[WorkerControl] Could not reach Python worker to start camera ${camera.id}:`,
        (err as Error).message,
      );
    }
  }

  async stopWorker(cameraId: string): Promise<void> {
    const url = `${this.workerUrl}/workers/${cameraId}/stop`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(this.TIMEOUT_MS),
      });

      if (response.ok) {
        console.log(`[WorkerControl] Stopped worker for camera: ${cameraId}`);
      } else {
        console.warn(
          `[WorkerControl] Python worker returned ${response.status} for stop(${cameraId})`,
        );
      }
    } catch (err) {
      console.warn(
        `[WorkerControl] Could not reach Python worker to stop camera ${cameraId}:`,
        (err as Error).message,
      );
    }
  }

  async restartWorker(camera: CameraPayload): Promise<void> {
    console.log(`[WorkerControl] Restarting worker for camera: ${camera.id}`);

    await this.stopWorker(camera.id);

    await new Promise<void>((resolve) => setTimeout(resolve, 600));

    await this.startWorker(camera);
  }
}
