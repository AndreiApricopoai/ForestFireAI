import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * UsersService handles all database operations related to users.
 * It is used by AuthService — never expose passwords in return values.
 */
@Injectable()
export class UsersService {
  /**
   * @InjectModel(User.name) injects the Mongoose model for the User schema.
   * This is how NestJS + Mongoose work together — no need to call
   * mongoose.model() manually.
   */
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Create a new user.
   * Checks for duplicate email, hashes the password, then saves to MongoDB.
   * Throws ConflictException (HTTP 409) if the email is already taken.
   */
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Check if a user with this email already exists
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase().trim(),
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    // Hash the plain text password with bcrypt
    // The number 12 is the "salt rounds" — higher = slower but more secure
    // 12 is a good balance for production
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // Create the Mongoose document and save it
    const newUser = new this.userModel({
      name: createUserDto.name,
      email: createUserDto.email.toLowerCase().trim(),
      password: hashedPassword,
      role: createUserDto.role,
    });

    return newUser.save();
  }

  /**
   * Find a user by email address.
   * Returns null if not found (does not throw).
   * Used by AuthService during login to look up the user.
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });
  }

  /**
   * Find a user by their MongoDB _id.
   * Used by JwtStrategy to validate the token on protected routes.
   */
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }
}
