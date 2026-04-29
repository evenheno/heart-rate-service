import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('PatientsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /patients/high-heart-rate-events returns the expected events', async () => {
    const response = await request(app.getHttpServer())
      .get('/patients/high-heart-rate-events')
      .expect(200);

    expect(response.body).toEqual({
      events: [
        {
          patientId: '1',
          patientName: 'Alice Johnson',
          timestamp: '2024-03-01T10:30:00Z',
          heartRate: 101,
        },
        {
          patientId: '2',
          patientName: 'Bob Smith',
          timestamp: '2024-03-02T11:00:00Z',
          heartRate: 105,
        },
      ],
    });
  });

  it('GET /patients/analytics returns analytics for all patients in range', async () => {
    const response = await request(app.getHttpServer())
      .get('/patients/analytics')
      .query({
        from: '2024-03-01T00:00:00Z',
        to: '2024-03-02T23:59:59Z',
      })
      .expect(200);

    expect(response.body).toEqual({
      analytics: [
        {
          patientId: '1',
          patientName: 'Alice Johnson',
          from: '2024-03-01T00:00:00Z',
          to: '2024-03-02T23:59:59Z',
          minHeartRate: 85,
          maxHeartRate: 101,
          avgHeartRate: 94.33,
          readingsCount: 3,
        },
        {
          patientId: '2',
          patientName: 'Bob Smith',
          from: '2024-03-01T00:00:00Z',
          to: '2024-03-02T23:59:59Z',
          minHeartRate: 88,
          maxHeartRate: 105,
          avgHeartRate: 95.33,
          readingsCount: 3,
        },
      ],
    });
  });

  it('GET /patients/:id returns a patient and increments tracking', async () => {
    const server = app.getHttpServer();

    await request(server).get('/patients/1').expect(200);
    await request(server)
      .get('/patients/high-heart-rate-events')
      .query({ patientId: '1' })
      .expect(200);
    await request(server)
      .get('/patients/analytics')
      .query({
        patientId: '1',
        from: '2024-03-01T00:00:00Z',
        to: '2024-03-02T23:59:59Z',
      })
      .expect(200);

    const patientResponse = await request(server).get('/patients/1').expect(200);
    expect(patientResponse.body).toEqual({
      id: '1',
      name: 'Alice Johnson',
      age: 34,
      gender: 'female',
    });

    const countsResponse = await request(server)
      .get('/patients/request-counts')
      .expect(200);

    expect(countsResponse.body).toEqual({
      requestCounts: [
        {
          patientId: '1',
          patientName: 'Alice Johnson',
          count: 4,
        },
      ],
    });
  });

  it('does not increment tracking for failed patient-specific requests', async () => {
    const server = app.getHttpServer();

    await request(server)
      .get('/patients/analytics')
      .query({
        patientId: '1',
        from: '2024-03-03T00:00:00Z',
        to: '2024-03-01T00:00:00Z',
      })
      .expect(400);

    await request(server)
      .get('/patients/unknown')
      .expect(404);

    const countsResponse = await request(server)
      .get('/patients/request-counts')
      .expect(200);

    expect(countsResponse.body).toEqual({
      requestCounts: [],
    });
  });

  it('returns 400 for invalid date ranges', async () => {
    const response = await request(app.getHttpServer())
      .get('/patients/analytics')
      .query({
        from: '2024-03-03T00:00:00Z',
        to: '2024-03-01T00:00:00Z',
      })
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      message: 'from must be earlier than or equal to to',
      error: 'Bad Request',
    });
  });

  it('returns 404 for unknown patients', async () => {
    const response = await request(app.getHttpServer())
      .get('/patients/unknown')
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      message: 'Patient with id unknown was not found',
      error: 'Not Found',
    });
  });
});
