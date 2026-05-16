import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

/**
 * AuthService contains the core authentication logic.
 * It uses UsersService for database access and JwtService to sign tokens.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user.
   *
   * Flow:
   *   1. Pass the data to UsersService.create() which handles hashing + saving
   *   2. Generate a JWT token for the new user
   *   3. Return the user data (without password) and the token
   */
  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password,
    });

    const token = this.generateToken(user);

    return {
      user: {
        id: (user._id as unknown as string).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: token,
    };
  }

  /**
   * Authenticate an existing user.
   *
   * Flow:
   *   1. Look up the user by email
   *   2. If not found, throw 401 (generic message — don't reveal whether email exists)
   *   3. Compare the plain text password against the stored hash using bcrypt
   *   4. If wrong password, throw 401
   *   5. Generate a JWT token and return user data + token
   */
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      // Use a generic message so attackers cannot enumerate valid emails
      throw new UnauthorizedException('Invalid email or password.');
    }

    // bcrypt.compare hashes the plain text and compares it to the stored hash
    const isPasswordCorrect = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: (user._id as unknown as string).toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: token,
    };
  }

  /**
   * Generate a signed JWT token for a user.
   * The token expires in 7 days (configured in AuthModule).
   */
  private generateToken(user: any): string {
    const payload: JwtPayload = {
      sub: (user._id as unknown as string).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
