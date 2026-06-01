import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
export class Alert {

  @Prop({ required: true })
  cameraId: string;

  @Prop({ required: true })
  detectionTimestamp: string;

  @Prop({ type: String, enum: ['fire', 'smoke', 'fire_and_smoke'], required: true })
  type: string;

  @Prop({ required: true })
  maxConfidence: number;

  @Prop({
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  })
  riskLevel: string;

  @Prop({ required: true })
  alertSnapshotUrl: string;

  @Prop({
    type: String,
    enum: ['pending', 'acknowledged', 'resolved'],
    default: 'pending',
  })
  status: string;

  @Prop({ default: '' })
  note: string;
}

export type AlertDocument = Alert & Document;
export const AlertSchema = SchemaFactory.createForClass(Alert);
