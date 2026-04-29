import { Test } from '@nestjs/testing';
import { SeedDataLoader } from '../src/data/seed-data.loader';
import { PatientsRepository } from '../src/patients/patients.repository';
import { PatientsService } from '../src/patients/patients.service';
import { TrackingModule } from '../src/tracking/tracking.module';

describe('PatientsService analytics', () => {
  let service: PatientsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TrackingModule],
      providers: [SeedDataLoader, PatientsRepository, PatientsService],
    }).compile();

    service = moduleRef.get(PatientsService);
  });

  it('computes analytics for patient 1', () => {
    const [result] = service.getAnalytics({
      patientId: '1',
      from: '2024-03-01T00:00:00Z',
      to: '2024-03-02T23:59:59Z',
    });

    expect(result).toEqual({
      patientId: '1',
      patientName: 'Alice Johnson',
      from: '2024-03-01T00:00:00Z',
      to: '2024-03-02T23:59:59Z',
      minHeartRate: 85,
      maxHeartRate: 101,
      avgHeartRate: 94.33,
      readingsCount: 3,
    });
  });

  it('computes analytics for patient 2', () => {
    const [result] = service.getAnalytics({
      patientId: '2',
      from: '2024-03-01T00:00:00Z',
      to: '2024-03-02T23:59:59Z',
    });

    expect(result).toEqual({
      patientId: '2',
      patientName: 'Bob Smith',
      from: '2024-03-01T00:00:00Z',
      to: '2024-03-02T23:59:59Z',
      minHeartRate: 88,
      maxHeartRate: 105,
      avgHeartRate: 95.33,
      readingsCount: 3,
    });
  });

  it('returns an empty array when no data exists in the range', () => {
    const result = service.getAnalytics({
      from: '2024-04-01T00:00:00Z',
      to: '2024-04-02T00:00:00Z',
    });

    expect(result).toEqual([]);
  });

  it('throws for an invalid range', () => {
    expect(() =>
      service.getAnalytics({
        from: '2024-03-03T00:00:00Z',
        to: '2024-03-01T00:00:00Z',
      }),
    ).toThrow('from must be earlier than or equal to to');
  });
});
