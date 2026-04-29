import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PatientRequestTrackerInterceptor } from './common/interceptors/patient-request-tracker.interceptor';
import { PatientsModule } from './patients/patients.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [TrackingModule, PatientsModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PatientRequestTrackerInterceptor,
    },
  ],
})
export class AppModule {}
