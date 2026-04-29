import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { HeartRateReading } from '../patients/models/heart-rate-reading.model';
import { Patient } from '../patients/models/patient.model';

interface SeedData {
  patients: Patient[];
  readings?: HeartRateReading[];
  heartRateReadings?: HeartRateReading[];
}

@Injectable()
export class SeedDataLoader {
  private readonly data: SeedData;

  constructor() {
    try {
      const filePath = join(__dirname, 'patients.json');
      this.data = JSON.parse(readFileSync(filePath, 'utf8')) as SeedData;
    } catch (error) {
      throw new Error(`Failed to load seed data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public getPatients(): Patient[] {
    return this.data.patients.map((patient) => ({ ...patient }));
  }

  public getReadings(): HeartRateReading[] {
    return (this.data.readings ?? this.data.heartRateReadings ?? []).map(
      (reading) => ({ ...reading }),
    );
  }
}
