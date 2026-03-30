import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { User, LoginRequest, LoginResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = environment.apiUrl;
  private readonly TOKEN_KEY = 'pos_token';
  private readonly USER_KEY = 'pos_user';

  currentUser = signal<User | null>(this.loadUser());
  isLoggedIn = computed(() => !!this.currentUser());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(data: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    const body = {
      ...data,
      terminalId: data.terminalId || environment.terminalId,
    };
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API}/auth/login`, body).pipe(
      tap((res) => {
        if (res.success && res.data) {
          localStorage.setItem(this.TOKEN_KEY, res.data.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.data.user));
          this.currentUser.set(res.data.user);
        }
      }),
    );
  }

  logout(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API}/auth/logout`, {}).pipe(
      tap(() => this.clearSession()),
    );
  }

  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API}/auth/me`);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private loadUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
}
