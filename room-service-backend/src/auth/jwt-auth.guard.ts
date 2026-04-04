import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';

interface JwtPayload {
  sub?: string;
  email?: string;
  fullName?: string;
  role?: string;
  roles?: Array<string | { authority?: string }>;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET || 'TXlTdXBlclNlY3JldEtleUZvckpXVFNpZ25pbmdBbmRUb2tlbkdlbmVyYXRpb24xMjM0NTY=';

    try {
      const payload = verify(token, Buffer.from(secret, 'base64')) as JwtPayload;
      const normalizedRoles = this.extractRoles(payload);

      request.user = {
        email: payload.email || payload.sub,
        fullName: payload.fullName,
        role: payload.role || normalizedRoles[0] || null,
        roles: normalizedRoles,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  private extractRoles(payload: JwtPayload): string[] {
    const tokenRoles = Array.isArray(payload.roles) ? payload.roles : [];
    const normalized = tokenRoles
      .map((role) => {
        if (typeof role === 'string') {
          return role.replace(/^ROLE_/, '').toUpperCase();
        }

        return role?.authority?.replace(/^ROLE_/, '').toUpperCase() || null;
      })
      .filter((role): role is string => Boolean(role));

    if (payload.role) {
      normalized.push(payload.role.toUpperCase());
    }

    return [...new Set(normalized)];
  }
}
