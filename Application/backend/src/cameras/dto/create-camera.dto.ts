import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  MinLength,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for creating a new Camera document.
 * Used by POST /cameras (admin only).
 */
export class CreateCameraDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  location: string;

  @IsString()
  @IsOptional()
  region?: string;

  /**
   * The filename of the video inside the cameras/ folder.
   * Example: "camera1.mp4"
   */
  @IsString()
  @MinLength(1)
  sourceUrl: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /** Seconds between each YOLO analysis run (default 5) */
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(300)
  analysisIntervalSeconds?: number;

  /** Minimum confidence to count a detection (0.0 – 1.0, default 0.45) */
  @IsNumber()
  @IsOptional()
  @Min(0.1)
  @Max(1.0)
  confidenceThreshold?: number;
}
