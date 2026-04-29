import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class GetHighHeartRateEventsQueryDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  to?: string;
}
