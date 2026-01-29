import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  getWelcome() {
    return {
      message: 'Welcome to Trip Planner API',
      documentation: '/api/docs/swagger or /api/docs/scalar',
    };
  }
}