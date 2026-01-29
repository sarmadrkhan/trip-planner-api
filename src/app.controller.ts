import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'API is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2026-01-27T20:00:00.000Z' },
        uptime: { type: 'number', example: 123.456 },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get()
  @ApiOperation({ summary: 'Welcome message' })
  @ApiResponse({
    status: 200,
    description: 'Returns welcome message',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Welcome to Trip Planner API' },
        documentation: { type: 'string', example: '/api/docs/swagger or /api/docs/scalar' },
      },
    },
  })
  getWelcome() {
    return this.appService.getWelcome();
  }
}