import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsEnum, IsNotEmpty, Length } from 'class-validator';

export enum SortStrategy {
  FASTEST = 'fastest',
  CHEAPEST = 'cheapest',
}

export class SearchTripDto {
  @ApiProperty({
    description: 'IATA 3-letter code of the origin',
    example: 'SYD',
    minLength: 3,
    maxLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3, { message: 'Origin must be an IATA 3-letter code' })
  @Transform(({ value }) => value?.toUpperCase())
  origin: string;

  @ApiProperty({
    description: 'IATA 3-letter code of the destination',
    example: 'GRU',
    minLength: 3,
    maxLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3, { message: 'Destination must be an IATA 3-letter code' })
  @Transform(({ value }) => value?.toUpperCase())
  destination: string;

  @ApiProperty({
    description: 'Sorting strategy for the results',
    enum: SortStrategy,
    example: SortStrategy.FASTEST,
  })
  @IsEnum(SortStrategy, {
    message: 'sort_by must be either "fastest" or "cheapest"',
  })
  sort_by: SortStrategy;
}