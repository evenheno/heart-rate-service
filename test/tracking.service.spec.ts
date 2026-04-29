import { TrackingService } from '../src/tracking/tracking.service';
import { TrackingStore } from '../src/tracking/tracking.store';

describe('TrackingService', () => {
  let service: TrackingService;

  beforeEach(() => {
    service = new TrackingService(new TrackingStore());
  });

  it('starts at zero for unknown patients', () => {
    expect(service.getCountByPatientId('1')).toBe(0);
  });

  it('increments counts', () => {
    service.increment('1');
    service.increment('1');

    expect(service.getCountByPatientId('1')).toBe(2);
  });

  it('tracks each patient independently', () => {
    service.increment('1');
    service.increment('2');
    service.increment('2');

    expect(service.getAllCounts()).toEqual([
      { patientId: '1', count: 1 },
      { patientId: '2', count: 2 },
    ]);
  });
});
