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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateCameraDto) {

    const before = await this.camerasService.findById(id);

    const updated = await this.camerasService.update(id, dto);

    const updatedPlain = (updated as unknown as { toJSON(): Record<string, unknown> }).toJSON();
    const beforePlain = (before as unknown as { toJSON(): Record<string, unknown> }).toJSON();

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

      void this.workerControl.stopWorker(id);
    } else if (isNowActive && !wasActive) {

      void this.workerControl.startWorker(workerPayload);
    } else if (isNowActive) {

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

    void this.workerControl.stopWorker(id);
    return this.camerasService.remove(id);
  }
}
