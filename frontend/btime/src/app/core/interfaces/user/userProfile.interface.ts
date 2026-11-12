export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
  activeDevicesCount: number;
}

export interface UpdateProfileReq {
  username: string;
  avatarUrl?: string;
  removeAvatar?: boolean;
}

export interface UpdateProfileRes {
  message: string;
  username: string;
  avatarUrl?: string | null;
  token: string;
}

export interface UploadAvatarRes {
  message: string;
  avatarUrl: string;
}

export interface VerifyPasswordReq {
  currentPassword: string;
}

export interface UpdateSensitiveReq {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}

export interface UpdateSensitiveRes {
  message: string;
  email: string;
  token: string;
}

export interface RequestSensitiveChangeReq {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}

export interface RequestSensitiveChangeRes {
  message: string;
  maskedEmail: string;
  expiresInMinutes: number;
}

export interface ConfirmSensitiveChangeReq {
  otpCode: string;
}

export interface ConfirmSensitiveChangeRes {
  message: string;
  email: string;
  token: string;
}
