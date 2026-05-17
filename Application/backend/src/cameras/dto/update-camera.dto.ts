import { PartialType } from '@nestjs/mapped-types';
import { CreateCameraDto } from './create-camera.dto';

/**
 * DTO for updating an existing camera.
 * All fields from CreateCameraDto become optional via PartialType.
 */
export class UpdateCameraDto extends PartialType(CreateCameraDto) {}
