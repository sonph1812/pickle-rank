import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlayerDocument = Player & Document;

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
export class Player {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false })
  logo: string; // Base64 avatar of the player

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

export const PlayerSchema = SchemaFactory.createForClass(Player);

// Pre-save hook to calculate points and played matches automatically
PlayerSchema.pre('save', function () {
  this.played = (this.wins || 0) + (this.losses || 0);
  this.points = (this.wins || 0) * 3;
});
