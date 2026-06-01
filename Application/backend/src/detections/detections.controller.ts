import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DetectionsService } from './detections.service';
import { CreateDetectionDto } from './dto/create-detection.dto';
import { WorkerAuthGuard } from '../common/guards/worker-auth.guard';

/**
 * DetectionsController exposes the endpoint that the Python worker calls.
 *
 * POST /detections
 *   Receives a detection payload from the Python worker and triggers:
 *     - MongoDB update  (camera.latestDetection)
 *     - WebSocket broadcast to subscribed frontend clients
 *     - Alert threshold check and creation if triggered
 *
 * The route is protected by WorkerAuthGuard.
 * The Python worker must send:
 *   Authorization: Bearer <WORKER_TOKEN>
 * in every request. The token is shared via environment variables and is
 * never exposed to end users or the frontend.
 */
@Controller('detections')
export class DetectionsController {
  constructor(private readonly detectionsService: DetectionsService) {}

  @Post()
  @UseGuards(WorkerAuthGuard)
  @HttpCode(HttpStatus.OK)
  processDetection(@Body() dto: CreateDetectionDto) {
    return this.detectionsService.processDetection(dto);
  }
}
