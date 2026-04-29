import { Injectable, NotFoundException } from '@nestjs/common';
import { isWithinInclusiveRange, parseOptionalDateRange, parseRequiredDateRange, } from '../common/utils/date-range.util'; import { calculateAverage } from '../common/utils/math.util';
import { TrackingService } from '../tracking/tracking.service';
import { GetHeartRateAnalyticsQueryDto } from './dto/get-heart-rate-analytics.query.dto';
import { GetHighHeartRateEventsQueryDto } from './dto/get-high-heart-rate-events.query.dto';
import { HeartRateReading } from './models/heart-rate-reading.model';
import { Patient } from './models/patient.model';
import { HeartRateAnalyticsResponse } from './responses/heart-rate-analytics.response';
import { HighHeartRateEventResponse } from './responses/high-heart-rate-event.response';
import { PatientRequestCountResponse } from './responses/patient-request-count.response';
import { PatientsRepository } from './patients.repository';

@Injectable()
export class PatientsService {

  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly trackingService: TrackingService,
  ) { }

  public getPatientById(id: string): Patient {
    return this.ensurePatientExists(id);
  }

  public ensurePatientExists(id: string): Patient {
    const patient = this.patientsRepository.getPatientById(id);

    if (!patient) {
      throw new NotFoundException(`Patient with id ${id} was not found`);
    }

    return patient;
  }

  public getHighHeartRateEvents(query: GetHighHeartRateEventsQueryDto): HighHeartRateEventResponse[] {
    if (query.patientId) {
      this.ensurePatientExists(query.patientId);
    }

    const { from, to } = parseOptionalDateRange(query.from, query.to);
    const patientsById = this.createPatientsMap();

    return this.getCandidateReadings(query.patientId)
      .filter((reading) => reading.heartRate > 100)
      .filter((reading) => isWithinInclusiveRange(reading.timestamp, from, to))
      .sort((left, right) => left.timestamp.localeCompare(right.timestamp))
      .map((reading) => ({
        patientId: reading.patientId,
        patientName: patientsById.get(reading.patientId)?.name ?? 'Unknown',
        timestamp: reading.timestamp,
        heartRate: reading.heartRate,
      }));
  }

  public getAnalytics(query: GetHeartRateAnalyticsQueryDto): HeartRateAnalyticsResponse[] {
    if (query.patientId) {
      this.ensurePatientExists(query.patientId);
    }

    const { from, to } = parseRequiredDateRange(query.from, query.to);
    const filteredReadings = this.getCandidateReadings(query.patientId).filter(
      (reading) => isWithinInclusiveRange(reading.timestamp, from, to),
    );

    if (filteredReadings.length === 0) {
      return [];
    }

    const patientsById = this.createPatientsMap();
    const groupedReadings = new Map<string, HeartRateReading[]>();

    filteredReadings.forEach((reading) => {
      const readings = groupedReadings.get(reading.patientId) ?? [];
      readings.push(reading);
      groupedReadings.set(reading.patientId, readings);
    });

    return [...groupedReadings.entries()]
      .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
      .map(([patientId, readings]) => {
        const heartRates = readings.map((reading) => reading.heartRate);
        const patient = patientsById.get(patientId);

        return {
          patientId,
          patientName: patient?.name ?? 'Unknown',
          from: query.from,
          to: query.to,
          minHeartRate: Math.min(...heartRates),
          maxHeartRate: Math.max(...heartRates),
          avgHeartRate: calculateAverage(heartRates),
          readingsCount: readings.length,
        };
      });
  }

  public getRequestCounts(): PatientRequestCountResponse[] {
    const patientsById = this.createPatientsMap();

    return this.trackingService.getAllCounts().map((entry) => ({
      patientId: entry.patientId,
      patientName: patientsById.get(entry.patientId)?.name ?? 'Unknown',
      count: entry.count,
    }));
  }

  private createPatientsMap(): Map<string, Patient> {
    return new Map(
      this.patientsRepository
        .getAllPatients()
        .map((patient) => [patient.id, patient] as const),
    );
  }

  private getCandidateReadings(patientId?: string): HeartRateReading[] {
    return patientId
      ? this.patientsRepository.getReadingsByPatientId(patientId)
      : this.patientsRepository.getAllReadings();
  }
}
