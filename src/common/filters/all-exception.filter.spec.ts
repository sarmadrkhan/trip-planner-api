import { AllExceptionsFilter } from './all-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { url: string };

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = { url: '/test-url' };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch HttpException and return proper response', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      path: '/test-url',
      error: 'Internal Server Error',
      message: 'Test error',
    });
  });

  it('should handle HttpException with object response', () => {
    const exception = new HttpException(
      {
        message: 'Validation failed',
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      path: '/test-url',
      error: 'Bad Request',
      message: 'Validation failed',
    });
  });

  it('should handle standard Error objects', () => {
    const exception = new Error('Standard error');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String),
      path: '/test-url',
      error: 'Internal Server Error',
      message: 'Standard error',
    });
  });

  it('should handle unknown exceptions', () => {
    const exception = 'Unknown error';

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: expect.any(String),
      path: '/test-url',
      error: 'Internal Server Error',
      message: 'Internal server error',
    });
  });

  it('should include timestamp in ISO format', () => {
    const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockArgumentsHost);

    const jsonCall = mockResponse.json.mock.calls[0][0];
    expect(jsonCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
