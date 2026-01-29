import { SavedTrip } from '../schemas/saved-trip.schema';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export type PaginatedSavedTrips = PaginatedResponse<SavedTrip>;