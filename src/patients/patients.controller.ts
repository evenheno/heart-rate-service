import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetHeartRateAnalyticsQueryDto } from './dto/get-heart-rate-analytics.query.dto';
import { GetHighHeartRateEventsQueryDto } from './dto/get-high-heart-rate-events.query.dto';
import { PatientIdParamDto } from './dto/patient-id.param.dto';
import { PatientsService } from './patients.service';

@Controller('patients')
export class PatientsController {

  constructor(private readonly patientsService: PatientsService) {}

  @Get('high-heart-rate-events')
  getHighHeartRateEvents(@Query() query: GetHighHeartRateEventsQueryDto) {
    return {
      events: this.patientsService.getHighHeartRateEvents(query),
    };
  }

  @Get('analytics')
  getAnalytics(@Query() query: GetHeartRateAnalyticsQueryDto) {
    return {
      analytics: this.patientsService.getAnalytics(query),
    };
  }

  @Get('request-counts')
  getRequestCounts() {
    return {
      requestCounts: this.patientsService.getRequestCounts(),
    };
  }

  @Get(':id')
  getPatientById(@Param() params: PatientIdParamDto) {
    return this.patientsService.getPatientById(params.id);
  }
}
