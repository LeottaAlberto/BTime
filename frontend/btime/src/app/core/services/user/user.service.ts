import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { environment } from "../../../../environments/environment";
import { AuthService } from "../../auth/auth.service";
import {
  ConfirmSensitiveChangeReq,
  ConfirmSensitiveChangeRes,
  RequestSensitiveChangeReq,
  RequestSensitiveChangeRes,
  UpdateProfileReq,
  UpdateProfileRes,
  UpdateSensitiveReq,
  UpdateSensitiveRes,
  UploadAvatarRes,
  UserProfile,
} from "../../interfaces/user/userProfile.interface";

@Injectable({ providedIn: "root" })
export class UserService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/user`;

  public getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/profile`).pipe(
      tap((profile) => {
        this.auth.updateCurrentUser({
          username: profile.username,
          email: profile.email,
          role: profile.role,
          avatarUrl: profile.avatarUrl ?? undefined,
        });
      }),
    );
  }

  public updateProfile(req: UpdateProfileReq): Observable<UpdateProfileRes> {
    return this.http.put<UpdateProfileRes>(`${this.baseUrl}/profile`, req).pipe(
      tap((res) => {
        this.auth.updateCurrentUser({
          username: res.username,
          avatarUrl: res.avatarUrl ?? undefined,
          token: res.token,
        });
      }),
    );
  }

  public uploadAvatar(file: File): Observable<UploadAvatarRes> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    return this.http.post<UploadAvatarRes>(`${this.baseUrl}/upload-avatar`, formData);
  }

  public verifyPassword(currentPassword: string): Observable<{ verified: boolean; message?: string }> {
    return this.http.post<{ verified: boolean; message?: string }>(`${this.baseUrl}/verify-password`, {
      currentPassword,
    });
  }

  public requestSensitiveChange(req: RequestSensitiveChangeReq): Observable<RequestSensitiveChangeRes> {
    return this.http.post<RequestSensitiveChangeRes>(`${this.baseUrl}/sensitive/request`, req);
  }

  public confirmSensitiveChange(req: ConfirmSensitiveChangeReq): Observable<ConfirmSensitiveChangeRes> {
    return this.http.post<ConfirmSensitiveChangeRes>(`${this.baseUrl}/sensitive/confirm`, req).pipe(
      tap((res) => {
        this.auth.updateCurrentUser({
          email: res.email,
          token: res.token,
        });
      }),
    );
  }

  public updateSensitive(req: UpdateSensitiveReq): Observable<UpdateSensitiveRes> {
    return this.http.put<UpdateSensitiveRes>(`${this.baseUrl}/sensitive`, req).pipe(
      tap((res) => {
        this.auth.updateCurrentUser({
          email: res.email,
          token: res.token,
        });
      }),
    );
  }
}
