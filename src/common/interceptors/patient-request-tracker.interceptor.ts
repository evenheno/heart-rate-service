import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { PatientsService } from '../../patients/patients.service';
import { TrackingService } from '../../tracking/tracking.service';

@Injectable()
export class PatientRequestTrackerInterceptor implements NestInterceptor {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly trackingService: TrackingService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const patientId = this.extractPatientId(request);

    if (!patientId) {
      return next.handle();
    }

    this.patientsService.ensurePatientExists(patientId);

    return next.handle().pipe(
      tap(() => {
        if (this.isSuccessfulStatus(response.statusCode)) {
          this.trackingService.increment(patientId);
        }
      }),
    );
  }

  private extractPatientId(request: Request): string | null {
    if (request.method !== 'GET') {
      return null;
    }

    const requestPath = request.originalUrl.split('?')[0];
    if (requestPath === '/patients/request-counts') {
      return null;
    }

    const id = request.params?.id;
    if (typeof id === 'string' && id.length > 0) {
      return typeof id === 'string' && id.length > 0 ? id : null;
    }

    const patientId = request.query.patientId;
    return typeof patientId === 'string' && patientId.length > 0
      ? patientId
      : null;
  }

  private isSuccessfulStatus(statusCode: number): boolean {
    return statusCode >= 200 && statusCode < 300;
  }
}
