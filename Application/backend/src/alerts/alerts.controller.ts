import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

/**
 * AlertsController — exposes read and status-update endpoints for Alert documents.
 *
 * All routes are admin-only: JWT + Role guard enforced on every action.
 *
 * GET  /alerts              → return all alerts, newest first
 * GET  /alerts?cameraId=x  → return alerts for a specific camera
 * PATCH /alerts/:id         → update status (acknowledge / resolve) + optional note
 */
@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  findAll(@Query('cameraId') cameraId?: string) {
    if (cameraId) {
      return this.alertsService.findByCameraId(cameraId);
    }
    return this.alertsService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAlertDto) {
    return this.alertsService.updateStatus(id, dto.status ?? 'pending', dto.note);
  }
}
