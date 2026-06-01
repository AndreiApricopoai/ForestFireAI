import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = User & Document;

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
    unique: true,     
    lowercase: true,  
    trim: true,
  })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: String,
    enum: Object.values(Role),
    default: Role.USER,       
  })
  role: Role;
}

export const UserSchema = SchemaFactory.createForClass(User);
