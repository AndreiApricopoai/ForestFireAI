import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DetectionsService } from './detections.service';
import { CreateDetectionDto } from './dto/create-detection.dto';

/**
 * DetectionsController exposes the endpoint that the Python worker calls.
 *
 * POST /detections
 *   Receives a detection payload from the Python worker and triggers:
 *     - MongoDB update (camera.latestDetection)
 *     - WebSocket broadcast to subscribed frontend clients
 *     - Alert check (skeleton)
 *
 * No authentication is required on this endpoint because it is only
 * called by the Python worker running on the same internal network.
 * (A worker API key or JWT can be added later for production hardening.)
 */
@Controller('detections')
export class DetectionsController {
  constructor(private readonly detectionsService: DetectionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  processDetection(@Body() dto: CreateDetectionDto) {
    return this.detectionsService.processDetection(dto);
  }
}
