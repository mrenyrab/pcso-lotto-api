import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

@Injectable()
export class CronTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expectedToken = process.env.CRON_TRIGGER_TOKEN;
    if (!expectedToken) {
      throw new InternalServerErrorException(
        'Cron trigger authentication is not configured.',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const match =
      typeof authorization === 'string'
        ? /^Bearer\s+(.+)$/i.exec(authorization)
        : null;

    if (!match) {
      throw new UnauthorizedException('A valid bearer token is required.');
    }

    const suppliedToken = Buffer.from(match[1], 'utf8');
    const configuredToken = Buffer.from(expectedToken, 'utf8');

    if (
      suppliedToken.length !== configuredToken.length ||
      !timingSafeEqual(suppliedToken, configuredToken)
    ) {
      throw new UnauthorizedException('A valid bearer token is required.');
    }

    return true;
  }
}
