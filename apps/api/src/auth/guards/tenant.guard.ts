import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { SessionUser } from '@vibedistro/types';

/**
 * Injects tenantId from JWT into request and validates that
 * any :tenantId param in the URL matches the session tenant
 * (unless the user is super_admin).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as SessionUser | undefined;

    if (!user) return true; // let JwtAuthGuard handle this

    // Attach tenantId to request for downstream use
    request.tenantId = user.tenantId;

    // If the URL contains a :tenantId param, verify it matches
    const paramTenantId: string | undefined = request.params?.['tenantId'];
    if (paramTenantId && user.roleSlug !== 'super_admin') {
      if (paramTenantId !== user.tenantId) {
        throw new ForbiddenException('Tenant access denied');
      }
    }

    return true;
  }
}
