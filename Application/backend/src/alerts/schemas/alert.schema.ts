import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Alert document schema.
 *
 * An Alert is created when the detection analysis decides a real danger event
 * has occurred (e.g. fire with high confidence in multiple consecutive frames).
 *
 * The actual creation logic lives in AlertsService.checkAndCreateAlert()
 * which is called every time a detection arrives. For now that method is
 * a skeleton — the rules will be filled in later.
 *
 * Snapshot images for alerts are saved to a separate "alerts/" folder
 * (not the same as the "snapshots/" folder that holds the latest frame).
 */
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
  /** The ID of the camera that triggered this alert */
  @Prop({ required: true })
  cameraId: string;

  /** ISO 8601 timestamp of when the detection that caused this alert was captured */
  @Prop({ required: true })
  detectionTimestamp: string;

  /** The primary type of hazard detected */
  @Prop({ type: String, enum: ['fire', 'smoke', 'fire_and_smoke'], required: true })
  type: string;

  /** Highest confidence score among the triggering detections */
  @Prop({ required: true })
  maxConfidence: number;

  /** Risk level at time of alert creation */
  @Prop({
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  })
  riskLevel: string;

  /**
   * URL to the alert snapshot image saved in the "alerts/" folder.
   * This is a separate copy from the rolling "snapshots/<id>_latest.jpg".
   * Example: "/alerts/683abc_1716820800000.jpg"
   */
  @Prop({ required: true })
  alertSnapshotUrl: string;

  /** Human-readable lifecycle status of this alert */
  @Prop({
    type: String,
    enum: ['pending', 'acknowledged', 'resolved'],
    default: 'pending',
  })
  status: string;

  /** Optional free-text note added by an operator when acknowledging/resolving */
  @Prop({ default: '' })
  note: string;
}

export type AlertDocument = Alert & Document;
export const AlertSchema = SchemaFactory.createForClass(Alert);
