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
