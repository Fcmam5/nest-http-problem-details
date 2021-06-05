import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Response } from 'express';
import {
  BASE_PROBLEMS_URI_KEY,
  defaultHttpErrors as _defaultHttpErrors,
  HTTP_ERRORS_MAP_KEY,
} from './constants';

export const PROBLEM_CONTENT_TYPE = 'application/problem+json';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(BASE_PROBLEMS_URI_KEY)
    private baseUri = '',
    @Inject(HTTP_ERRORS_MAP_KEY)
    private defaultHttpErrors?,
  ) {
    this.defaultHttpErrors = defaultHttpErrors || _defaultHttpErrors;
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse() as
      | string
      | IExceptionResponse;

    // eslint-disable-next-line @typescript-eslint/ban-types
    let title: string | object;
    let detail: string | undefined;
    let instance: string | undefined;

    let type: string;

    if (typeof errorResponse === 'string') {
      title = errorResponse;
    } else {
      if (errorResponse.error) {
        title = errorResponse.error;
        detail = errorResponse.message;
        instance = errorResponse.instance;
      } else {
        title = errorResponse.message;
      }
      type = errorResponse.type;
    }

    response
      .type(PROBLEM_CONTENT_TYPE)
      .status(status)
      .json({
        type: `${this.baseUri}/${type || this.getDefaultType(status)}`,
        title,
        status,
        detail,
        instance,
      });
  }

  private getDefaultType(status: number) {
    return this.defaultHttpErrors[status];
  }
}

interface IExceptionResponse {
  // eslint-disable-next-line @typescript-eslint/ban-types
  error?: string | object;
  message: string;
  type?: string;
  instance?: string;
  statusCode: number;
}
