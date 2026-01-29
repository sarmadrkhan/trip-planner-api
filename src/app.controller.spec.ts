import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = module.get<AppController>(AppController);
    appService = module.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined();
    });
  });

  describe('getWelcome', () => {
    it('should return welcome message with documentation link', () => {
      const result = {
        message: 'Welcome to Trip Planner API',
        documentation: '/api/docs/swagger or /api/docs/scalar',
      };

      jest.spyOn(appService, 'getWelcome').mockImplementation(() => result);

      expect(appController.getWelcome()).toEqual(result);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('documentation');
    });
  });

  describe('getHealth', () => {
    it('should return health status with all required fields', () => {
      const result = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 123.456,
      };

      jest.spyOn(appService, 'getHealth').mockImplementation(() => result);

      const health = appController.getHealth();
      
      expect(health).toEqual(result);
      expect(health).toHaveProperty('status', 'ok');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('uptime');
    });

    it('should call appService.getHealth', () => {
      const getHealthSpy = jest.spyOn(appService, 'getHealth');
      
      appController.getHealth();
      
      expect(getHealthSpy).toHaveBeenCalled();
    });
  });
});