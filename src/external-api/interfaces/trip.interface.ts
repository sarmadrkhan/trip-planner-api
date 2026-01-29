export interface Trip {
  origin: string;
  destination: string;
  cost: number;
  duration: number;
  type: string;
  id: string;
  display_name: string;
}

export interface TripSearchParams {
  origin: string;
  destination: string;
}