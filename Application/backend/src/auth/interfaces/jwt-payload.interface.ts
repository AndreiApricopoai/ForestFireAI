import { Role } from '../../common/enums/role.enum';

/**
 * The shape of the data encoded inside the JWT token.
 *
 * 'sub' is the standard JWT claim for the subject (user ID).
 * The rest is extra info we embed so we don't need a DB lookup on every request.
 */
export interface JwtPayload {
  sub: string;   // MongoDB user _id as string
  email: string;
  name: string;
  role: Role;
}
