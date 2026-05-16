import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Validation rules for the POST /auth/register endpoint.
 * These mirror the frontend validation exactly.
 */
export class RegisterDto {
  @IsString({ message: 'Name must be a string.' })
  @MinLength(2, { message: 'Name must be at least 2 characters.' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @IsString({ message: 'Password must be a string.' })
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  password: string;
}
