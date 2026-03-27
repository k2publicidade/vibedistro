import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { SessionUser } from '@vibedistro/types';

interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roleSlug: string;
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] ?? 'changeme',
    });
  }

  validate(payload: JwtPayload): SessionUser {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException();
    }
    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      roleSlug: payload.roleSlug,
      permissions: payload.permissions,
    };
  }
}
