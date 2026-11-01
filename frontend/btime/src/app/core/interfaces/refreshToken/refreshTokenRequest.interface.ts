export interface RefreshTokenRequest {
  JwtToken: string;
  RefreshToken: string;
  IsTvAppBTime?: boolean;
}
