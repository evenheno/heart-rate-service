import { Injectable } from '@nestjs/common';

export interface TrackingCountEntry {
  patientId: string;
  count: number;
}

@Injectable()
export class TrackingStore {
  private readonly counts = new Map<string, number>();

  increment(patientId: string): number {
    const nextValue = (this.counts.get(patientId) ?? 0) + 1;
    this.counts.set(patientId, nextValue);
    return nextValue;
  }

  getCountByPatientId(patientId: string): number {
    return this.counts.get(patientId) ?? 0;
  }

  getAllCounts(): TrackingCountEntry[] {
    return [...this.counts.entries()]
      .map(([patientId, count]) => ({ patientId, count }))
      .sort((left, right) => left.patientId.localeCompare(right.patientId));
  }
}
