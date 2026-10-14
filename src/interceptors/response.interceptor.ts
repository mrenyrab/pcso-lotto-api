import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

type ApiResponse = {
  status: number;
  message: string;
  action_at: Date;
  data: unknown;
};

type PayloadResponse = Response & { payload?: ApiResponse };

/**
 * Formats the response of APIs.
 *
 * @public
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<PayloadResponse>();

    return next.handle().pipe(
      map((data: unknown): ApiResponse => {
        return (response.payload = {
          status: response.statusCode,
          message: 'Success',
          action_at: new Date(),
          data: data ?? {},
        });
      }),
    );
  }
}
