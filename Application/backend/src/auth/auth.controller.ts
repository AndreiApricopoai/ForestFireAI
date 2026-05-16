import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/**
 * AuthController exposes the public authentication endpoints.
 * No JWT guard here — these routes must be accessible without a token.
 *
 * Routes:
 *   POST /auth/register  — create account
 *   POST /auth/login     — sign in
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   *
   * Accepts: { name, email, password }
   * Returns: { user: { id, name, email, role }, token }
   * Throws:  409 if email is already taken
   *          400 if validation fails (handled by ValidationPipe)
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/login
   *
   * Accepts: { email, password }
   * Returns: { user: { id, name, email, role }, token }
   * Throws:  401 if credentials are invalid
   *
   * @HttpCode(HttpStatus.OK) overrides NestJS default of 201 for POST.
   * Login is not creating a resource so 200 is more appropriate.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
