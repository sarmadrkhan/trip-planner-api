import { Test, TestingModule } from '@nestjs/testing';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { SortStrategy } from './dto/search-trip.dto';
import { Trip } from '../external-api/interfaces/trip.interface';

describe('TripsController', () => {
  let controller: TripsController;
  let service: TripsService;

  const mockTrips: Trip[] = [
    {
      origin: 'SYD',
      destination: 'GRU',
      cost: 400,
      duration: 3,
      type: 'flight',
      id: '1',
      display_name: 'from SYD to GRU by flight',
    },
    {
      origin: 'SYD',
      destination: 'GRU',
      cost: 625,
      duration: 5,
      type: 'train',
      id: '2',
      display_name: 'from SYD to GRU by train',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsController],
      providers: [
        {
          provide: TripsService,
          useValue: {
            searchTrips: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(require('@nestjs/throttler').ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TripsController>(TripsController);
    service = module.get<TripsService>(TripsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchTrips', () => {
    it('should return sorted trips from service', async () => {
      const searchDto = {
        origin: 'SYD',
        destination: 'GRU',
        sort_by: SortStrategy.FASTEST,
      };

      jest.spyOn(service, 'searchTrips').mockResolvedValue(mockTrips);

      const result = await controller.searchTrips(searchDto);

      expect(result).toEqual(mockTrips);
      expect(service.searchTrips).toHaveBeenCalledWith(searchDto);
    });

    it('should call service with cheapest sorting strategy', async () => {
      const searchDto = {
        origin: 'ATL',
        destination: 'LAX',
        sort_by: SortStrategy.CHEAPEST,
      };

      jest.spyOn(service, 'searchTrips').mockResolvedValue(mockTrips);

      await controller.searchTrips(searchDto);

      expect(service.searchTrips).toHaveBeenCalledWith(searchDto);
    });

    it('should return empty array when no trips found', async () => {
      const searchDto = {
        origin: 'SYD',
        destination: 'LAX',
        sort_by: SortStrategy.FASTEST,
      };

      jest.spyOn(service, 'searchTrips').mockResolvedValue([]);

      const result = await controller.searchTrips(searchDto);

      expect(result).toEqual([]);
    });
  });
});
