import { Schema, model, Document } from 'mongoose';

export interface IPlace extends Document {
  name: string;
  sport_type: string;
  latitude: number;
  longitude: number;
  description?: string;
}

const PlaceSchema = new Schema<IPlace>({
  name: { type: String, required: true },
  sport_type: { type: String, required: true }, // z.B. 'Volleyball'
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  description: { type: String }
}, {
  timestamps: true // Erstellt automatisch createdAt und updatedAt
});

export const Place = model<IPlace>('Place', PlaceSchema);
