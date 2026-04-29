import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else {
        const responseBody = exceptionResponse as Record<string, unknown>;
        const responseMessage = responseBody.message;

        message = Array.isArray(responseMessage)
          ? String(responseMessage[0])
          : String(responseMessage ?? exception.message);
        error =
          typeof responseBody.error === 'string'
            ? responseBody.error
            : exception.name;
      }
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
    });
  }
}
