import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

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

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {

      throw new UnauthorizedException('Invalid email or password.');
    }

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
