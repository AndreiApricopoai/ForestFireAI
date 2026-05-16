import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

/**
 * Data Transfer Object for creating a user.
 *
 * class-validator decorators define the validation rules.
 * NestJS's ValidationPipe runs these automatically on every request.
 */
export class CreateUserDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters.' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  password: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Role must be user, admin, or worker.' })
  role?: Role;
}
