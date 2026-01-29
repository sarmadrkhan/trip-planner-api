import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { Trip, TripSearchParams } from './interfaces/trip.interface';
import { redactSensitiveFields } from '../common/utils/redact.util';

@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('EXTERNAL_API_URL', '');
    this.apiKey = this.configService.get<string>('EXTERNAL_API_KEY', '');

    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: 10000,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug(`Request to: ${config.url}`);
        this.logger.debug(`Full URL: ${config.baseURL}${config.url}`);
        const sanitizedHeaders = redactSensitiveFields(config.headers as Record<string, string>);
        this.logger.debug(`Request headers: ${JSON.stringify(sanitizedHeaders)}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug(`Response from: ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error('Response error:', error.message);
        return Promise.reject(error);
      },
    );
  }

  /**
   * Search trips by origin and destination
   * @param params - Origin and destination IATA codes
   * @returns Promise<Trip[]> - Filtered trips matching the search criteria
   */
  async searchTrips(params: TripSearchParams): Promise<Trip[]> {
    try {
      this.logger.log(
        `Searching trips from ${params.origin} to ${params.destination}`,
      );

      const response = await this.axiosInstance.get<Trip[]>('', {
        params: {
          origin: params.origin,
          destination: params.destination,
        },
      });

      if (!Array.isArray(response.data)) {
        this.logger.error('Invalid response format from external API');
        throw new HttpException(
          'Invalid response from external trip provider',
          HttpStatus.BAD_GATEWAY,
        );
      }

      this.logger.log(
        `Found ${response.data.length} trips from ${params.origin} to ${params.destination}`,
      );

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return this.handleApiError(error);
    }
  }

  /**
   * Handle API errors and convert them to appropriate HTTP exceptions
   * @param error - The error from axios or other sources
   */
  private handleApiError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        // Server responded with error status
        this.logger.error(
          `External API error: ${axiosError.response.status} - ${axiosError.response.statusText}`,
        );
        throw new HttpException(
          'External trip provider returned an error',
          axiosError.response.status,
        );
      } else if (axiosError.request) {
        // Request was made but no response received
        this.logger.error('No response from external API');
        throw new HttpException(
          'External trip provider is not responding',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
    }

    this.logger.error('Unexpected error:', error);
    throw new HttpException(
      'An unexpected error occurred while fetching trips',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}