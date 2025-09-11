import type { 
  GetHotelSearchRequestQuery, 
  GetHotelSearchResponse, 
  GetHotelOffersByHotel_idRequestQuery,
  GetHotelOffersByHotel_idResponse 
} from '../types';

const API_BASE_URL = 'http://localhost:8128';

export class ApiService {
  static async searchHotels(params: GetHotelSearchRequestQuery): Promise<GetHotelSearchResponse> {
    const queryParams = new URLSearchParams({
      location: params.location,
      check_in_date: params.check_in_date || '',
      check_out_date: params.check_out_date || '',
      page: params.page.toString(),
      per_page: params.per_page.toString(),
      sort: params.sort,
      order: params.order,
    });

    const response = await fetch(`${API_BASE_URL}/hotels/search?${queryParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  static async getHotelOffers(
    hotelId: string, 
    params: Partial<GetHotelOffersByHotel_idRequestQuery> = {}
  ): Promise<GetHotelOffersByHotel_idResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.check_in_date) queryParams.append('check_in_date', params.check_in_date);
    if (params.check_out_date) queryParams.append('check_out_date', params.check_out_date);
    if (params.active_only !== undefined) queryParams.append('active_only', params.active_only.toString());

    const url = `${API_BASE_URL}/hotels/${hotelId}/offers${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
}

export interface Hotel {
  id: string;
  title: string;
  address: string;
  rating: number;
  description: string;
  source: string;
  external_id: string;
  created_at?: string;
  updated_at?: string;
  // Search-specific fields
  best_price?: number;
  total_offers?: number;
  available_rooms?: number;
  currency?: string;
}

export interface Room {
  id: string;
  title: string;
  type: string;
  capacity: number;
  hotel_id: string;
  source: string;
  external_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Offer {
  id: string;
  price: number;
  room_id: string;
  currency: string;
  check_in_date: string;
  check_out_date: string;
  source: string;
  external_id: string;
  last_seen_at: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SearchResponse {
  hotels: Hotel[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
  search: {
    location: string;
    check_in_date: string;
    check_out_date: string;
    sort: string;
    order: string;
  };
}

export interface RoomWithOffers {
  room: Room;
  offers: Offer[];
  offer_count: number;
  min_price: number | null;
  max_price: number | null;
}

export interface HotelOffersResponse {
  hotel: Hotel;
  rooms: RoomWithOffers[];
  summary: {
    total_rooms: number;
    total_offers: number;
    min_price: number | null;
    max_price: number | null;
    average_price: number | null;
  };
  filters: {
    check_in_date: string | null;
    check_out_date: string | null;
    active_only: boolean;
  };
}
