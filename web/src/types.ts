// Generated TypeScript definitions for BaseApi
// Do not edit manually - regenerate with: php bin/console types:generate

export type UUID = string;
export type Envelope<T> = { data: T };

export interface ErrorResponse {
  error: string;
  requestId: string;
  errors?: Record<string, string>;
}

export interface GetHealthRequestQuery {
  db: string;
  request?: any;
}

export type GetHealthResponse = Envelope<any>;

export interface PostHealthRequestBody {
  db: string;
  request?: any;
}

export type PostHealthResponse = Envelope<any>;

export interface PostSignupRequestBody {
  name: string;
  email: string;
  password: string;
  request?: any;
}

export type PostSignupResponse = Envelope<{ user: any[] }>;

export interface PostLoginRequestBody {
  email: string;
  password: string;
  request?: any;
}

export type PostLoginResponse = Envelope<{ user: any[] }>;

export interface PostLogoutRequestBody {
  request?: any;
}

export type PostLogoutResponse = Envelope<{ message: string }>;

export interface GetMeRequestQuery {
  request?: any;
}

export type GetMeResponse = Envelope<{ user: any[] }>;

export interface GetHotelSearchRequestQuery {
  location: string;
  check_in_date: string;
  check_out_date: string;
  page: number;
  per_page: number;
  sort: string;
  order: string;
  request?: any;
}

export type GetHotelSearchResponse = Envelope<any>;

export interface GetHotelOffersByHotel_idRequestPath {
  hotel_id: string;
}

export interface GetHotelOffersByHotel_idRequestQuery {
  check_in_date: string;
  check_out_date: string;
  active_only: boolean;
  request?: any;
}

export type GetHotelOffersByHotel_idResponse = Envelope<any>;
