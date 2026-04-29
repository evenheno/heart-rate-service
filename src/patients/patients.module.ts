import { Module } from '@nestjs/common';
import { SeedDataLoader } from '../data/seed-data.loader';
import { TrackingModule } from '../tracking/tracking.module';
import { PatientsController } from './patients.controller';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';

@Module({
  imports: [TrackingModule],
  controllers: [PatientsController],
  providers: [SeedDataLoader, PatientsRepository, PatientsService],
  exports: [PatientsService, PatientsRepository],
})
export class PatientsModule {}
