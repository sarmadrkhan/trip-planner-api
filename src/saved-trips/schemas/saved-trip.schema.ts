import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SavedTripDocument = SavedTrip & Document;

@Schema({ timestamps: true })
export class SavedTrip {
  @Prop({ required: true })
  origin: string;

  @Prop({ required: true })
  destination: string;

  @Prop({ required: true })
  cost: number;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true, unique: true })
  tripId: string;

  @Prop({ required: true })
  display_name: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const SavedTripSchema = SchemaFactory.createForClass(SavedTrip);