import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/dto/create-user.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;
    const { user }: Request = context.switchToHttp().getRequest();

    return requiredRoles.some((role) => user?.role == role); // return true when the user matches at least one of the criterias
  }
}
