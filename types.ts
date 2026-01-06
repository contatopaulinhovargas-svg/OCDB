
export interface Venue {
  id: string;
  name: string;
  city: string;
  ddd: string;
  socialMedia?: string;
  distanceKm: number;
  travelTime?: string;
  notes?: string;
  createdAt: number;
}

export type DDDRegion = '48' | '47' | '49' | 'Outros';

export interface GroupedVenues {
  [key: string]: Venue[];
}
