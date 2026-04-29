import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetHeartRateAnalyticsQueryDto {
  @IsNotEmpty()
  @IsISO8601({ strict: true })
  from!: string;

  @IsNotEmpty()
  @IsISO8601({ strict: true })
  to!: string;

  @IsOptional()
  @IsString()
  patientId?: string;
}
