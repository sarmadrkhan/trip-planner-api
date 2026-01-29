import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TripsService } from './trips.service';
import { ExternalApiService } from '../external-api/external-api.service';
import { SortStrategy } from './dto/search-trip.dto';
import { Trip } from '../external-api/interfaces/trip.interface';

describe('TripsService', () => {
  let service: TripsService;
  let externalApiService: ExternalApiService;
  let cacheManager: Cache;

  const mockTrips: Trip[] = [
    {
      origin: 'SYD',
      destination: 'GRU',
      cost: 625,
      duration: 5,
      type: 'flight',
      id: '1',
      display_name: 'from SYD to GRU by flight',
    },
    {
      origin: 'SYD',
      destination: 'GRU',
      cost: 400,
      duration: 8,
      type: 'train',
      id: '2',
      display_name: 'from SYD to GRU by train',
    },
    {
      origin: 'SYD',
      destination: 'GRU',
      cost: 500,
      duration: 3,
      type: 'car',
      id: '3',
      display_name: 'from SYD to GRU by car',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        {
          provide: ExternalApiService,
          useValue: {
            searchTrips: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    externalApiService = module.get<ExternalApiService>(ExternalApiService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchTrips', () => {
    it('should return cached results if available', async () => {
      const searchDto = {
        origin: 'SYD',
        destination: 'GRU',
        sort_by: SortStrategy.FASTEST,
      };

      const cachedTrips = [mockTrips[2], mockTrips[0], mockTrips[1]];
      jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedTrips);

      const result = await service.searchTrips(searchDto);

      expect(result).toEqual(cachedTrips);
      expect(cacheManager.get).toHaveBeenCalledWith('trips:SYD:GRU:fastest');
      expect(externalApiService.searchTrips).not.toHaveBeenCalled();
    });

    it('should fetch and sort trips by fastest (duration) when cache miss', async () => {
      const searchDto = {
        origin: 'SYD',
        destination: 'GRU',
        sort_by: SortStrategy.FASTEST,
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      jest.spyOn(externalApiService, 'searchTrips').mockResolvedValue(mockTrips);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.searchTrips(searchDto);

      expect(result[0].duration).toBe(3);
      expect(result[1].duration).toBe(5);
      expect(result[2].duration).toBe(8);

      expect(externalApiService.searchTrips).toHaveBeenCalledWith({
        origin: 'SYD',
        destination: 'GRU',
      });
      expect(cacheManager.set).toHaveBeenCalledWith('trips:SYD:GRU:fastest', result);
    });

    it('should fetch and sort trips by cheapest (cost) when cache miss', async () => {
      const searchDto = {
        origin: 'SYD',
        destination: 'GRU',
        sort_by: SortStrategy.CHEAPEST,
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      jest.spyOn(externalApiService, 'searchTrips').mockResolvedValue(mockTrips);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.searchTrips(searchDto);

      expect(result[0].cost).toBe(400);
      expect(result[1].cost).toBe(500);
      expect(result[2].cost).toBe(625);

      expect(cacheManager.set).toHaveBeenCalledWith('trips:SYD:GRU:cheapest', result);
    });

    it('should return empty array when no trips found', async () => {
      const searchDto = {
        origin: 'SYD',
        destination: 'LAX',
        sort_by: SortStrategy.FASTEST,
      };

      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      jest.spyOn(externalApiService, 'searchTrips').mockResolvedValue([]);

      const result = await service.searchTrips(searchDto);

      expect(result).toEqual([]);
    });

    it('should throw BadRequestException for unsupported origin', async () => {
      const searchDto = {
        origin: 'XXX',
        destination: 'GRU',
        sort_by: SortStrategy.FASTEST,
      };

      await expect(service.searchTrips(searchDto)).rejects.toThrow(BadRequestException);
      await expect(service.searchTrips(searchDto)).rejects.toThrow(
        'The following places are not supported: XXX',
      );
    });

    it('should throw BadRequestException for unsupported destination', async () => {
      const searchDto = {
        origin: 'SYD',
        destination: 'YYY',
        sort_by: SortStrategy.FASTEST,
      };

      await expect(service.searchTrips(searchDto)).rejects.toThrow(BadRequestException);
      await expect(service.searchTrips(searchDto)).rejects.toThrow(
        'The following places are not supported: YYY',
      );
    });

    it('should throw BadRequestException when origin equals destination', async () => {
      const searchDto = {
        origin: 'SYD',
        destination: 'SYD',
        sort_by: SortStrategy.FASTEST,
      };

      await expect(service.searchTrips(searchDto)).rejects.toThrow(BadRequestException);
      await expect(service.searchTrips(searchDto)).rejects.toThrow(
        'Origin and destination cannot be the same',
      );
    });

    it('should not mutate the original trips array when sorting', async () => {
      const searchDto = {
        origin: 'SYD',
        destination: 'GRU',
        sort_by: SortStrategy.FASTEST,
      };

      const originalTrips = [...mockTrips];
      jest.spyOn(cacheManager, 'get').mockResolvedValue(undefined);
      jest.spyOn(externalApiService, 'searchTrips').mockResolvedValue(mockTrips);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      await service.searchTrips(searchDto);

      expect(mockTrips).toEqual(originalTrips);
    });
  });
});
