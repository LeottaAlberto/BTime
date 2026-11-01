import { LoginResponse } from "../login/loginResponse.interface";

export interface QrCreateRequest {
  IpAddress: string;
  DeviceInfo: string;
  IsTvAppBTime: boolean;
}

export interface QrCreateResponse {
  code: string;
  expiresAtUtc: string;
  expiresInSeconds: number;
  suggestedHost?: string | null;
}

export interface QrInfoResponse {
  valid: boolean;
  status: "Pending" | "Approved" | "Consumed" | "Expired";
  deviceInfo: string;
  isTvAppBTime: boolean;
  remainingSeconds: number;
}

export interface QrStatusResponse {
  status: "Pending" | "Approved" | "Expired";
  remainingSeconds: number;
  loginResponse?: LoginResponse | null;
}

export interface QrApproveRequest {
  code: string;
}

export interface QrApproveWithCredentialsRequest {
  code: string;
  username: string;
  email: string;
  password: string;
}

