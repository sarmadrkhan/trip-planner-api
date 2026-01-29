import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exception.filter';

describe('Trip Planner API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health & Root Endpoints', () => {
    it('GET / - should return welcome message', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('documentation');
          expect(res.body.documentation).toBe('/api/docs/swagger or /api/docs/scalar');
        });
    });

    it('GET /health - should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
        });
    });
  });

  describe('Trip Search (GET /trips/search)', () => {
    it('should search trips with valid parameters', () => {
      return request(app.getHttpServer())
        .get('/trips/search')
        .query({ origin: 'SYD', destination: 'GRU', sort_by: 'fastest' })
        .expect(200)
        .expect((res: request.Response) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should handle case-insensitive IATA codes', () => {
      return request(app.getHttpServer())
        .get('/trips/search')
        .query({ origin: 'syd', destination: 'gru', sort_by: 'cheapest' })
        .expect(200)
        .expect((res: request.Response) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return 400 for invalid IATA code length', () => {
      return request(app.getHttpServer())
        .get('/trips/search')
        .query({ origin: 'SY', destination: 'GRU', sort_by: 'fastest' })
        .expect(400);
    });

    it('should return 400 for invalid sort_by parameter', () => {
      return request(app.getHttpServer())
        .get('/trips/search')
        .query({ origin: 'SYD', destination: 'GRU', sort_by: 'invalid' })
        .expect(400);
    });

    it('should return 400 for unsupported places', () => {
      return request(app.getHttpServer())
        .get('/trips/search')
        .query({ origin: 'XXX', destination: 'YYY', sort_by: 'fastest' })
        .expect(400)
        .expect((res: request.Response) => {
          expect(res.body.message).toContain('not supported');
        });
    });

    it('should return 400 when origin equals destination', () => {
      return request(app.getHttpServer())
        .get('/trips/search')
        .query({ origin: 'SYD', destination: 'SYD', sort_by: 'fastest' })
        .expect(400)
        .expect((res: request.Response) => {
          expect(res.body.message).toContain('cannot be the same');
        });
    });

    it('should return 400 for missing required parameters', () => {
      return request(app.getHttpServer())
        .get('/trips/search')
        .query({ origin: 'SYD' })
        .expect(400);
    });
  });

  describe('Saved Trips CRUD', () => {
    let savedTripId: string;

    const testTrip = {
      origin: 'SYD',
      destination: 'GRU',
      cost: 625,
      duration: 5,
      type: 'flight',
      tripId: `e2e-test-${Date.now()}`,
      display_name: 'from SYD to GRU by flight',
    };

    it('POST /trips/saved - should save a trip', () => {
      return request(app.getHttpServer())
        .post('/trips/saved')
        .send(testTrip)
        .expect(201)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('origin', 'SYD');
          expect(res.body).toHaveProperty('tripId', testTrip.tripId);
          savedTripId = res.body._id;
        });
    });

    it('POST /trips/saved - should return 409 for duplicate tripId', () => {
      return request(app.getHttpServer())
        .post('/trips/saved')
        .send(testTrip)
        .expect(409)
        .expect((res: request.Response) => {
          expect(res.body.message).toContain('already saved');
        });
    });

    it('POST /trips/saved - should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/trips/saved')
        .send({ origin: 'SYD' }) // Missing required fields
        .expect(400);
    });

    it('POST /trips/saved - should return 400 for negative cost', () => {
      return request(app.getHttpServer())
        .post('/trips/saved')
        .send({ ...testTrip, tripId: 'new-id', cost: -100 })
        .expect(400);
    });

    it('GET /trips/saved - should list saved trips with pagination', () => {
      return request(app.getHttpServer())
        .get('/trips/saved')
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('page', 1);
          expect(res.body.meta).toHaveProperty('limit', 10);
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('totalPages');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('GET /trips/saved - should use default pagination', () => {
      return request(app.getHttpServer())
        .get('/trips/saved')
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(10);
        });
    });

    it('GET /trips/saved - should validate pagination limits', () => {
      return request(app.getHttpServer())
        .get('/trips/saved')
        .query({ page: 1, limit: 200 }) // Exceeds max
        .expect(400);
    });

    it('GET /trips/saved/:id - should get a specific saved trip', () => {
      return request(app.getHttpServer())
        .get(`/trips/saved/${savedTripId}`)
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty('_id', savedTripId);
          expect(res.body).toHaveProperty('origin', 'SYD');
        });
    });

    it('GET /trips/saved/:id - should return 404 for non-existent trip', () => {
      return request(app.getHttpServer())
        .get('/trips/saved/507f1f77bcf86cd799439011') // Non-existent ID
        .expect(404);
    });

    it('DELETE /trips/saved/:id - should delete a saved trip', () => {
      return request(app.getHttpServer())
        .delete(`/trips/saved/${savedTripId}`)
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body).toHaveProperty('_id', savedTripId);
        });
    });

    it('DELETE /trips/saved/:id - should return 404 after deletion', () => {
      return request(app.getHttpServer())
        .delete(`/trips/saved/${savedTripId}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', () => {
      return request(app.getHttpServer()).get('/non-existent-route').expect(404);
    });

    it('should handle malformed requests gracefully', () => {
      return request(app.getHttpServer())
        .post('/trips/saved')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting headers', () => {
      return request(app.getHttpServer())
        .get('/trips/search')
        .query({ origin: 'SYD', destination: 'GRU', sort_by: 'fastest' })
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.headers).toHaveProperty('x-ratelimit-limit');
        });
    });
  });
});