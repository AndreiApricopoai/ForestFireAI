import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

class DetectionItem {
  @Prop({ required: true })
  class: string;

  @Prop({ required: true })
  confidence: number;

  @Prop({ type: [Number], required: true })
  bbox: number[];
}

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

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {

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

  @Prop({ required: true })
  sourceUrl: string;

  @Prop({ default: true })
  isActive: boolean;

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

  @Prop({ type: Object, default: null })
  latestDetection: LatestDetection | null;
}

export type CameraDocument = Camera & Document;
export const CameraSchema = SchemaFactory.createForClass(Camera);
