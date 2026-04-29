export class HeartRateAnalyticsResponse {
  patientId!: string;
  patientName!: string;
  from!: string;
  to!: string;
  minHeartRate!: number;
  maxHeartRate!: number;
  avgHeartRate!: number;
  readingsCount!: number;
}
