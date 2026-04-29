import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Observable, of, throwError, lastValueFrom } from 'rxjs';
import { PatientRequestTrackerInterceptor } from '../src/common/interceptors/patient-request-tracker.interceptor';
import { PatientsService } from '../src/patients/patients.service';
import { TrackingService } from '../src/tracking/tracking.service';

describe('PatientRequestTrackerInterceptor', () => {
  let interceptor: PatientRequestTrackerInterceptor;
  let ensurePatientExists: jest.Mock;
  let increment: jest.Mock;

  beforeEach(() => {
    ensurePatientExists = jest.fn();
    increment = jest.fn();

    interceptor = new PatientRequestTrackerInterceptor(
      { ensurePatientExists } as unknown as PatientsService,
      { increment } as unknown as TrackingService,
    );
  });

  it('increments tracking for successful patient-specific requests', async () => {
    const context = createContext({
      request: {
        method: 'GET',
        originalUrl: '/patients/1',
        params: { id: '1' },
        query: {},
      },
      response: { statusCode: 200 },
    });

    await lastValueFrom(interceptor.intercept(context, createNextHandler(of({ id: '1' }))));

    expect(ensurePatientExists).toHaveBeenCalledWith('1');
    expect(increment).toHaveBeenCalledWith('1');
  });

  it('does not increment tracking when the request handler fails', async () => {
    const context = createContext({
      request: {
        method: 'GET',
        originalUrl: '/patients/1',
        params: { id: '1' },
        query: {},
      },
      response: { statusCode: 500 },
    });

    await expect(
      lastValueFrom(
        interceptor.intercept(
          context,
          createNextHandler(throwError(() => new Error('boom'))),
        ),
      ),
    ).rejects.toThrow('boom');

    expect(ensurePatientExists).toHaveBeenCalledWith('1');
    expect(increment).not.toHaveBeenCalled();
  });

  it('does not increment tracking for completed non-2xx responses', async () => {
    const context = createContext({
      request: {
        method: 'GET',
        originalUrl: '/patients/analytics?patientId=1',
        params: {},
        query: { patientId: '1' },
      },
      response: { statusCode: 400 },
    });

    await lastValueFrom(interceptor.intercept(context, createNextHandler(of([]))));

    expect(ensurePatientExists).toHaveBeenCalledWith('1');
    expect(increment).not.toHaveBeenCalled();
  });

  it('ignores non-trackable requests', async () => {
    const context = createContext({
      request: {
        method: 'GET',
        originalUrl: '/patients/request-counts',
        params: {},
        query: {},
      },
      response: { statusCode: 200 },
    });

    await lastValueFrom(interceptor.intercept(context, createNextHandler(of([]))));

    expect(ensurePatientExists).not.toHaveBeenCalled();
    expect(increment).not.toHaveBeenCalled();
  });
});

function createContext({
  request,
  response,
}: {
  request: {
    method: string;
    originalUrl: string;
    params: Record<string, string>;
    query: Record<string, string>;
  };
  response: {
    statusCode: number;
  };
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as ExecutionContext;
}

function createNextHandler(value: Observable<unknown>): CallHandler {
  return {
    handle: () => value,
  };
}
