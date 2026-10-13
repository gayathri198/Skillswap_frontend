import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const API_BASE_URL = 'http://localhost:5218/api/';
export const AUTH_EXPIRED_NOTICE_KEY = 'authExpiredNotice';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  if (!request.url.startsWith(API_BASE_URL)) {
    return next(request);
  }

  const isLoginRequest = /\/login(?:\?|$)/i.test(request.url);
  const token = isLoginRequest ? null : getAuthToken();
  const authenticatedRequest = token && !request.headers.has('Authorization')
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse
        && error.status === 401
        && !isLoginRequest
        && authenticatedRequest.headers.has('Authorization')
        && getAuthToken() === token
      ) {
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem(AUTH_EXPIRED_NOTICE_KEY, 'true');
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};

function getAuthToken(): string | null {
  const storedToken = localStorage.getItem('token');
  if (storedToken?.trim()) {
    return stripBearerPrefix(storedToken);
  }

  const userDetails = localStorage.getItem('userdetails');
  if (!userDetails) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(userDetails);
    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    const details = parsed as Record<string, unknown>;
    const user = typeof details['user'] === 'object' && details['user'] !== null
      ? details['user'] as Record<string, unknown>
      : {};
    const token = details['token']
      ?? details['accessToken']
      ?? details['jwtToken']
      ?? user['token']
      ?? user['accessToken']
      ?? user['jwtToken'];

    return typeof token === 'string' && token.trim()
      ? stripBearerPrefix(token)
      : null;
  } catch (error) {
    console.error('Failed to read the saved authentication token:', error);
    return null;
  }
}

function stripBearerPrefix(token: string): string {
  return token.replace(/^Bearer\s+/i, '').trim();
}
