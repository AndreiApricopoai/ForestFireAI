import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Represents one detected object inside a single snapshot analysis.
 * This is embedded inside LatestDetection — not a separate collection.
 */
class DetectionItem {
  @Prop({ required: true })
  class: string; // 'fire' or 'smoke'

  @Prop({ required: true })
  confidence: number;

  @Prop({ type: [Number], required: true })
  bbox: number[]; // [x1, y1, x2, y2] pixel coordinates
}

/**
 * The most recent YOLO result for this camera.
 * Embedded directly in the Camera document — no separate collection.
 * Gets overwritten on every detection POST from the Python worker.
 */
class LatestDetection {
  @Prop({ required: true })
  timestamp: string;

  @Prop({ required: true })
  snapshotUrl: string;

  @Prop({ type: [Object], default: [] })
  detections: DetectionItem[];

  @Prop({
    type: String,
    enum: ['none', 'low', 'medium', 'high', 'critical'],
    default: 'none',
  })
  riskLevel: string;

  @Prop()
  videoTimestampMs: number;
}

/**
 * Camera document schema.
 *
 * Each camera maps to one video source (local file, RTSP stream, etc.).
 * The Python worker fetches all isActive cameras on startup and spins up
 * one thread per camera.
 *
 * toJSON transform:
 *   - Adds 'id' string field (from _id ObjectId)
 *   - Removes internal _id and __v fields from API responses
 */
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      // Rename _id → id as a plain string so the Python worker can use it
      ret.id = (ret._id as { toString(): string } | undefined)?.toString();
      delete ret._id;
      delete ret.__v;
    },
  },
})
export class Camera {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  location: string;

  @Prop({ default: '' })
  region: string;

  /**
   * sourceUrl is the filename of the video inside the cameras/ folder.
   * Example: "camera1.mp4"
   * The Python worker builds the full path: CAMERAS_FOLDER + sourceUrl
   */
  @Prop({ required: true })
  sourceUrl: string;

  /**
   * isActive controls whether the Python worker will process this camera.
   * If false, the worker skips it on startup.
   */
  @Prop({ default: true })
  isActive: boolean;

  /**
   * status reflects whether the Python worker is currently running for this camera.
   * Updated by the worker via the NestJS API.
   */
  @Prop({
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'inactive',
  })
  status: string;

  @Prop({ default: 5 })
  analysisIntervalSeconds: number;

  @Prop({ default: 0.45 })
  confidenceThreshold: number;

  /**
   * The latest detection result from the Python worker.
   * null when no detection has been received yet.
   */
  @Prop({ type: Object, default: null })
  latestDetection: LatestDetection | null;
}

export type CameraDocument = Camera & Document;
export const CameraSchema = SchemaFactory.createForClass(Camera);
