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

/**
 * Represents a single detected object inside a frame.
 * Sent as part of the detection payload from the Python worker.
 */
export class DetectionItemDto {
  /** Class label — 'fire' or 'smoke' */
  @IsString()
  class: string;

  /** Model confidence score — 0.0 to 1.0 */
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  /**
   * Bounding box in pixel coordinates: [x1, y1, x2, y2]
   * Top-left corner (x1, y1) and bottom-right corner (x2, y2).
   */
  @IsArray()
  @ArrayMinSize(4)
  bbox: number[];
}

/**
 * Full detection payload POSTed by the Python worker for each processed frame.
 *
 * The payload is sent to POST /detections.
 * NestJS uses this DTO to validate the incoming data before processing.
 *
 * Python sends:
 * {
 *   "cameraId":        "683abc123...",
 *   "timestamp":       "2026-05-16T17:30:00.000Z",
 *   "videoTimestampMs": 35000,
 *   "snapshotUrl":     "/snapshots/683abc123..._latest.jpg",
 *   "detections": [
 *     { "class": "fire", "confidence": 0.82, "bbox": [120, 80, 340, 260] }
 *   ]
 * }
 */
export class CreateDetectionDto {
  /** MongoDB _id of the camera document (as a string) */
  @IsString()
  cameraId: string;

  /** ISO 8601 UTC timestamp of when the frame was captured */
  @IsString()
  timestamp: string;

  /** Position in the video file in milliseconds at the time of capture */
  @IsNumber()
  videoTimestampMs: number;

  /**
   * URL path to the annotated snapshot image served by NestJS.
   * Example: "/snapshots/683abc123..._latest.jpg"
   */
  @IsString()
  snapshotUrl: string;

  /**
   * List of objects detected in this frame.
   * Can be empty if YOLO found nothing above the confidence threshold.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetectionItemDto)
  @IsOptional()
  detections: DetectionItemDto[];
}
