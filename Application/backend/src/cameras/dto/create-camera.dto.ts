import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  MinLength,
  Min,
  Max,
} from 'class-validator';

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

  @IsString()
  @MinLength(1)
  sourceUrl: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(300)
  analysisIntervalSeconds?: number;

  @IsNumber()
  @IsOptional()
  @Min(0.1)
  @Max(1.0)
  confidenceThreshold?: number;
}
