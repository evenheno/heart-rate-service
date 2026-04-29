import { Injectable } from '@nestjs/common';
import { SeedDataLoader } from '../data/seed-data.loader';
import { HeartRateReading } from './models/heart-rate-reading.model';
import { Patient } from './models/patient.model';

@Injectable()
export class PatientsRepository {
  
  private readonly patients: Patient[];
  private readonly readings: HeartRateReading[];

  constructor(seedDataLoader: SeedDataLoader) {
    this.patients = seedDataLoader.getPatients();
    this.readings = seedDataLoader.getReadings();
  }

  getAllPatients(): Patient[] {
    return this.patients.map((patient) => ({ ...patient }));
  }

  getPatientById(id: string): Patient | undefined {
    const patient = this.patients.find((entry) => entry.id === id);
    return patient ? { ...patient } : undefined;
  }

  getAllReadings(): HeartRateReading[] {
    return this.readings.map((reading) => ({ ...reading }));
  }

  getReadingsByPatientId(id: string): HeartRateReading[] {
    return this.readings
      .filter((reading) => reading.patientId === id)
      .map((reading) => ({ ...reading }));
  }
}
