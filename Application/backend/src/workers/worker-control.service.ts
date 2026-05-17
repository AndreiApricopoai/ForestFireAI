import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * The fields the Python worker needs when starting a camera thread.
 * Must match what camera_worker.py reads from the camera dict.
 */
interface CameraPayload {
  id: string;
  name: string;
  sourceUrl: string;
  analysisIntervalSeconds: number;
  confidenceThreshold: number;
}

/**
 * WorkerControlService — NestJS → Python worker HTTP bridge.
 *
 * The Python FastAPI service exposes three control endpoints:
 *   GET  /status                    — list all worker threads
 *   POST /workers/{id}/start        — start (or restart) a camera thread
 *   POST /workers/{id}/stop         — signal a camera thread to stop
 *
 * This service is called by CamerasController after admin PATCH operations
 * so the running Python worker immediately reflects the new configuration
 * without needing a full restart.
 *
 * All methods are fire-and-forget with a timeout:
 *   - If the Python worker is not running the request simply fails silently.
 *   - MongoDB is always updated first — the DB is the source of truth.
 *   - On the next Python worker startup it will re-fetch cameras and apply
 *     the latest settings, so nothing is ever permanently out of sync.
 */
@Injectable()
export class WorkerControlService {
  private readonly workerUrl: string;
  // Maximum milliseconds to wait for the Python worker to respond
  private readonly TIMEOUT_MS = 5000;

  constructor(private readonly configService: ConfigService) {
    this.workerUrl =
      this.configService.get<string>('PYTHON_WORKER_URL') ??
      'http://localhost:8000';
  }

  /**
   * Tell the Python worker to start a new thread for this camera.
   *
   * If a thread is already running for this camera, the Python worker
   * will log it and do nothing — calling start() on a running camera is safe.
   */
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
      // Python worker is not running — this is not a fatal error.
      // The change is already saved in MongoDB and will be picked up on the next startup.
      console.warn(
        `[WorkerControl] Could not reach Python worker to start camera ${camera.id}:`,
        (err as Error).message,
      );
    }
  }

  /**
   * Tell the Python worker to stop the thread for this camera.
   *
   * The thread will finish its current frame and exit cleanly.
   * Safe to call even if the camera is not currently running.
   */
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

  /**
   * Restart the worker for a camera with updated settings.
   *
   * Used when the admin changes analysisIntervalSeconds or confidenceThreshold
   * on a camera that is currently being processed. The running thread uses
   * the old values baked in at startup — a restart is the only way to apply new ones.
   *
   * Steps:
   *   1. Stop the current thread
   *   2. Wait 600ms for the thread to exit gracefully
   *   3. Start a new thread with the updated camera data
   */
  async restartWorker(camera: CameraPayload): Promise<void> {
    console.log(`[WorkerControl] Restarting worker for camera: ${camera.id}`);

    await this.stopWorker(camera.id);

    // Give the thread enough time to finish its current frame and release the video
    await new Promise<void>((resolve) => setTimeout(resolve, 600));

    await this.startWorker(camera);
  }
}
