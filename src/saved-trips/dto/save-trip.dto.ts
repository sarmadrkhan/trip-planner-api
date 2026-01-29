import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class SaveTripDto {
  @ApiProperty({
    description: 'IATA 3-letter code of the origin',
    example: 'SYD',
  })
  @IsString()
  @IsNotEmpty()
  origin: string;

  @ApiProperty({
    description: 'IATA 3-letter code of the destination',
    example: 'GRU',
  })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({
    description: 'Cost of the trip',
    example: 625,
  })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiProperty({
    description: 'Duration of the trip in hours',
    example: 5,
  })
  @IsNumber()
  @Min(0)
  duration: number;

  @ApiProperty({
    description: 'Type of transportation',
    example: 'flight',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Unique identifier of the trip from search results',
    example: 'a749c866-7928-4d08-9d5c-a6821a583d1a',
  })
  @IsString()
  @IsNotEmpty()
  tripId: string;

  @ApiProperty({
    description: 'Display name of the trip',
    example: 'from SYD to GRU by flight',
  })
  @IsString()
  @IsNotEmpty()
  display_name: string;
}