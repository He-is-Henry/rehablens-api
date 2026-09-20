import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AuditAction } from './audit-action.enum';

@Schema({ _id: false })
export class AuditParty {
  @Prop({ required: true }) userId!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ required: true }) role!: string;
  @Prop() customId?: string;
}
const AuditPartySchema = SchemaFactory.createForClass(AuditParty);

@Schema({ _id: false })
export class AuditObject {
  @Prop() id?: string;
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  type!: string;
}
const AuditObjectSchema = SchemaFactory.createForClass(AuditObject);

@Schema()
export class AuditLog {
  @Prop({ required: true, enum: AuditAction, index: true })
  action!: AuditAction;

  @Prop({ type: AuditPartySchema, required: true })
  actor!: AuditParty;

  @Prop({ type: AuditObjectSchema })
  object?: AuditObject;

  @Prop({ type: [AuditPartySchema], default: [] })
  affected!: AuditParty[];

  @Prop()
  ipAddress?: string;

  @Prop()
  deviceInfo?: string;

  @Prop()
  location?: string;

  @Prop({ enum: ['success', 'failure'], default: 'success' })
  outcome!: 'success' | 'failure';

  @Prop() note?: string;

  @Prop({ type: [String], default: [], index: true })
  seenBy!: string[];

  @Prop({
    required: true,
    default: Date.now,
    index: { expireAfterSeconds: 60 * 60 * 24 * 90 },
  })
  createdAt!: Date;
}

export type AuditLogDocument = AuditLog & Document;
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ 'actor.userId': 1, createdAt: -1 });
AuditLogSchema.index({ 'affected.userId': 1, createdAt: -1 });
