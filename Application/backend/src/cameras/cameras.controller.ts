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

/**
 * CamerasController exposes the cameras REST API.
 *
 * GET    /cameras          — list all (or only active via ?active=true)
 * GET    /cameras/:id      — get one camera
 * POST   /cameras          — create camera (admin only)
 * PATCH  /cameras/:id      — update camera (admin only)
 * DELETE /cameras/:id      — delete camera (admin only)
 *
 * The Python worker calls GET /cameras without auth because it uses
 * the internal BACKEND_URL. For now we keep GET public so the worker
 * doesn't need a JWT. Write operations require admin role.
 */
@Controller('cameras')
export class CamerasController {
  constructor(private readonly camerasService: CamerasService) {}

  /**
   * GET /cameras
   * GET /cameras?active=true  — only returns cameras with isActive = true
   *
   * No auth required — the Python worker calls this on startup.
   */
  @Get()
  findAll(@Query('active') active?: string) {
    if (active === 'true') {
      return this.camerasService.findActive();
    }

    return this.camerasService.findAll();
  }

  /**
   * GET /cameras/:id
   * No auth required — used internally.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.camerasService.findById(id);
  }

  /**
   * POST /cameras
   * Admin only — adds a new camera to the database.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateCameraDto) {
    return this.camerasService.create(dto);
  }

  /**
   * PATCH /cameras/:id
   * Admin only — updates camera fields (isActive, name, thresholds, etc.).
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCameraDto) {
    return this.camerasService.update(id, dto);
  }

  /**
   * DELETE /cameras/:id
   * Admin only.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.camerasService.remove(id);
  }
}
