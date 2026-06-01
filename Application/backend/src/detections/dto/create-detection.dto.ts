import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DetectionItemDto {

  @IsString()
  class: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @IsArray()
  @ArrayMinSize(4)
  bbox: number[];
}

export class CreateDetectionDto {

  @IsString()
  cameraId: string;

  @IsString()
  timestamp: string;

  @IsNumber()
  videoTimestampMs: number;

  @IsString()
  snapshotUrl: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetectionItemDto)
  @IsOptional()
  detections: DetectionItemDto[];
}
