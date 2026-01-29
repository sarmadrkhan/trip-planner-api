import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { ExternalApiService } from './external-api.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ExternalApiService', () => {
  let service: ExternalApiService;
  let configService: ConfigService;

  const mockTrips = [
    {
      origin: 'SYD',
      destination: 'GRU',
      cost: 625,
      duration: 5,
      type: 'flight',
      id: 'a749c866-7928-4d08-9d5c-a6821a583d1a',
      display_name: 'from SYD to GRU by flight',
    },
    {
      origin: 'SYD',
      destination: 'GRU',
      cost: 400,
      duration: 8,
      type: 'train',
      id: 'b849c866-7928-4d08-9d5c-a6821a583d1b',
      display_name: 'from SYD to GRU by train',
    },
    {
      origin: 'ATL',
      destination: 'LAX',
      cost: 300,
      duration: 3,
      type: 'flight',
      id: 'c949c866-7928-4d08-9d5c-a6821a583d1c',
      display_name: 'from ATL to LAX by flight',
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockAxiosInstance = {
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalApiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'EXTERNAL_API_URL') return 'http://test-api.com';
              if (key === 'EXTERNAL_API_KEY') return 'test-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ExternalApiService>(ExternalApiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchTrips', () => {
    it('should search trips with query parameters', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: mockTrips.filter((t) => t.origin === 'SYD' && t.destination === 'GRU'),
      });

      const result = await service.searchTrips({
        origin: 'SYD',
        destination: 'GRU',
      });

      expect(result).toHaveLength(2);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('', {
        params: {
          origin: 'SYD',
          destination: 'GRU',
        },
      });
    });

    it('should throw HttpException when API returns invalid data', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockResolvedValue({
        data: 'invalid data',
      });

      await expect(service.searchTrips({ origin: 'SYD', destination: 'GRU' })).rejects.toThrow(
        HttpException,
      );
      await expect(service.searchTrips({ origin: 'SYD', destination: 'GRU' })).rejects.toThrow(
        'Invalid response from external trip provider',
      );
    });

    it('should handle network errors', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue({
        isAxiosError: true,
        request: {},
        message: 'Network Error',
      });

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      await expect(service.searchTrips({ origin: 'SYD', destination: 'GRU' })).rejects.toThrow(
        HttpException,
      );
    });

    it('should handle API errors during search', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.get as jest.Mock).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 500,
          statusText: 'Internal Server Error',
        },
        message: 'Server Error',
      });

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      await expect(service.searchTrips({ origin: 'SYD', destination: 'GRU' })).rejects.toThrow(
        HttpException,
      );
    });
  });
});
