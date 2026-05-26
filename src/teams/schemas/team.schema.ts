import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TeamDocument = Team & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    },
  },
})
export class Team {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false })
  logo: string;

  @Prop({ default: 0 })
  wins: number;

  @Prop({ default: 0 })
  losses: number;

  @Prop({ default: 0 })
  goalsDifference: number;

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: 0 })
  played: number;
}

export const TeamSchema = SchemaFactory.createForClass(Team);

// Pre-save hook to calculate points and played matches automatically
TeamSchema.pre('save', function () {
  this.played = (this.wins || 0) + (this.losses || 0);
  this.points = (this.wins || 0) * 3;
});
