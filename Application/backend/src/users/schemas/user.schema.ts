import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

/**
 * UserDocument is the type that combines the User class with
 * Mongoose's Document type (adds _id, save(), etc.)
 */
export type UserDocument = User & Document;

/**
 * @Schema({ timestamps: true }) tells Mongoose to automatically add
 * createdAt and updatedAt fields to every document.
 */
@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,      // MongoDB creates a unique index on this field
    lowercase: true,   // Always stored in lowercase
    trim: true,
  })
  email: string;

  @Prop({ required: true })
  password: string; // Stored as a bcrypt hash, never plain text

  @Prop({
    type: String,
    enum: Object.values(Role), // Only allow values from the Role enum
    default: Role.USER,        // New users get the 'user' role by default
  })
  role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);
