import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { TrackingStore } from './tracking.store';

@Module({
  providers: [TrackingStore, TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
