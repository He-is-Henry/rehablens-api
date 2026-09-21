import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { Payload } from '../dto/create-auth.dto';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      response.skipLog = true; // don't log this request, it'll bloat errors, and it's not an actual error
      throw new UnauthorizedException(
        'Access token missing from request headers',
      );
    }

    try {
      const payload: Payload = await this.jwtService.verifyAsync(token);
      if (
        payload.mustChangePassword &&
        !request.url.includes('/auth/change-initial-password') &&
        !request.url.includes('/auth/profile')
      ) {
        response.skipLog = true;

        throw new ForbiddenException({
          statusCode: 403,
          message: 'You must change your temporary password before proceeding.',
          error: 'MustChangePassword',
        });
      }

      request.user = payload;
      this.cls.set('userId', payload.id);
      this.cls.set('sessionId', payload.sessionId);
    } catch (e) {
      console.log('setting skiplog to true');
      response.skipLog = true;

      if (e instanceof ForbiddenException) throw e;
      console.log(e);
      throw new UnauthorizedException(
        'Session expired or invalid authentication token',
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
