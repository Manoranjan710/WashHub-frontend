export type CenterStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface CenterSearchResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  avg_rating: number;
  total_reviews: number;
  service_count: number;
  distance_km: number | null;
  status: CenterStatus;
  created_at: string;
}

export interface Center {
  id: string;
  vendor_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: CenterStatus;
  avg_rating: number;
  total_reviews: number;
  created_at: string;
}

export interface Service {
  id: string;
  center_id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_mins: number;
  is_active: boolean;
}

export interface CreateCenterInput {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  price: number;
  duration_mins: number;
}
