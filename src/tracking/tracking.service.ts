import { Injectable } from '@nestjs/common';
import { TrackingCountEntry, TrackingStore } from './tracking.store';

@Injectable()
export class TrackingService {
  constructor(private readonly trackingStore: TrackingStore) {}

  increment(patientId: string): number {
    return this.trackingStore.increment(patientId);
  }

  getCountByPatientId(patientId: string): number {
    return this.trackingStore.getCountByPatientId(patientId);
  }

  getAllCounts(): TrackingCountEntry[] {
    return this.trackingStore.getAllCounts();
  }
}
