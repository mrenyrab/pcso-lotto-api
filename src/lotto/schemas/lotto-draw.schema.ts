import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LottoDrawDocument = HydratedDocument<LottoDraw>;

@Schema({ timestamps: true })
export class LottoDraw {
  @Prop({ required: true, trim: true, index: true })
  gameName: string; // e.g., "Ultra Lotto 6/58"

  @Prop({ required: true, type: [Number] })
  numbers: number[]; // e.g., [4, 18, 22, 35, 41, 53]

  @Prop({ required: true, type: Date, index: true })
  drawDate: Date;

  @Prop({ required: true, default: 0 })
  jackpot: number;

  @Prop({ required: true, default: 0 })
  winners: number;
}

export const LottoDrawSchema = SchemaFactory.createForClass(LottoDraw);

// Compound unique index to guarantee no duplicate draws per game per date
LottoDrawSchema.index({ gameName: 1, drawDate: 1 }, { unique: true });