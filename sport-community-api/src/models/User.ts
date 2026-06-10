import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username:     string;
  email:        string;
  passwordHash: string;
  avatarUrl?:   string;
  bio?:         string;
  createdAt:    Date;
  comparePassword(plain: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username:     { type: String, required: true, unique: true, trim: true, minlength: 3 },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl:    { type: String },
    bio:          { type: String, maxlength: 300 },
  },
  { timestamps: true },
);

// Passwort vergleichen
UserSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

// Passwort-Hash aus JSON-Ausgabe entfernen
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as unknown as Record<string, unknown>)['passwordHash'];
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);
