import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CamerasService } from './cameras.service';
import { CreateCameraDto } from './dto/create-camera.dto';
import { UpdateCameraDto } from './dto/update-camera.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { WorkerControlService } from '../workers/worker-control.service';

/**
 * CamerasController exposes the cameras REST API.
 *
 * GET    /cameras          — list all (or ?active=true for active only)
 * GET    /cameras/:id      — single camera
 * POST   /cameras          — create (admin only)
 * PATCH  /cameras/:id      — update (admin only) — also notifies Python worker
 * DELETE /cameras/:id      — delete (admin only)
 *
 * GET endpoints are public so the Python worker can call them without auth.
 * Write endpoints require admin JWT.
 */
@Controller('cameras')
export class CamerasController {
  constructor(
    private readonly camerasService: CamerasService,
    private readonly workerControl: WorkerControlService,
  ) {}

  @Get()
  findAll(@Query('active') active?: string) {
    if (active === 'true') {
      return this.camerasService.findActive();
    }
    return this.camerasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.camerasService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCameraDto) {
    return this.camerasService.create(dto);
  }

  /**
   * PATCH /cameras/:id
   *
   * After saving the change to MongoDB, notify the Python worker so it
   * reflects the new configuration immediately without a full restart.
   *
   * Decision logic:
   *
   *   isActive → false          Stop the worker thread for this camera.
   *
   *   isActive → true (was off) Start a new worker thread with the current settings.
   *
   *   settings changed          If the camera is active, restart its thread so the
   *   (interval/confidence)     new values take effect immediately.
   *
   * All worker calls are best-effort — if the Python worker is not running the
   * error is logged and the API still returns 200. MongoDB is always updated.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateCameraDto) {
    // Read the current state BEFORE the update so we can detect what changed
    const before = await this.camerasService.findById(id);

    // Persist the change to MongoDB
    const updated = await this.camerasService.update(id, dto);

    // toJSON() produces a plain object including the virtual 'id' string field
    const updatedPlain = (updated as unknown as { toJSON(): Record<string, unknown> }).toJSON();
    const beforePlain = (before as unknown as { toJSON(): Record<string, unknown> }).toJSON();

    // Build the payload the Python worker needs to (re)start a thread
    const workerPayload = {
      id: updatedPlain.id as string,
      name: updatedPlain.name as string,
      sourceUrl: updatedPlain.sourceUrl as string,
      analysisIntervalSeconds: updatedPlain.analysisIntervalSeconds as number,
      confidenceThreshold: updatedPlain.confidenceThreshold as number,
    };

    const wasActive = beforePlain.isActive as boolean;
    const isNowActive = updatedPlain.isActive as boolean;

    if (!isNowActive && wasActive) {
      // Camera was deactivated → stop the thread
      void this.workerControl.stopWorker(id);
    } else if (isNowActive && !wasActive) {
      // Camera was activated → start a new thread
      void this.workerControl.startWorker(workerPayload);
    } else if (isNowActive) {
      // Camera stays active but settings changed → restart so new values apply
      const settingsChanged =
        dto.analysisIntervalSeconds !== undefined ||
        dto.confidenceThreshold !== undefined ||
        dto.sourceUrl !== undefined;

      if (settingsChanged) {
        void this.workerControl.restartWorker(workerPayload);
      }
    }

    return updated;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    // Stop the worker thread before deleting the camera document
    void this.workerControl.stopWorker(id);
    return this.camerasService.remove(id);
  }
}
