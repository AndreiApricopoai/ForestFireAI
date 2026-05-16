import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

/**
 * Key used to store required roles on a route handler's metadata.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator that marks a route as requiring specific roles.
 *
 * Usage:
 *   @Roles(Role.ADMIN)
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   deleteCamera() { ... }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
