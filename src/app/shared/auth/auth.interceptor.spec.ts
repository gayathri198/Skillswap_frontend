import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_EXPIRED_NOTICE_KEY, authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: { navigate: vi.fn().mockResolvedValue(true) },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('adds the bearer token from saved user details to API requests', () => {
    localStorage.setItem('userdetails', JSON.stringify({
      user: { id: 8 },
      accessToken: 'saved-token',
    }));

    http.get('http://localhost:5218/api/Skill').subscribe();
    const request = httpTestingController.expectOne('http://localhost:5218/api/Skill');
    expect(request.request.headers.get('Authorization')).toBe('Bearer saved-token');
    request.flush([]);
  });

  it('clears the session and redirects with an expiry notice after an authenticated 401', () => {
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('userdetails', JSON.stringify({ user: { id: 8 } }));

    http.get('http://localhost:5218/api/Skill').subscribe({ error: () => undefined });
    httpTestingController.expectOne('http://localhost:5218/api/Skill').flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );
    expect(localStorage.getItem('userdetails')).toBeNull();
    expect(sessionStorage.getItem(AUTH_EXPIRED_NOTICE_KEY)).toBe('true');
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login']);
  });

  it('does not treat a login 401 as an expired authenticated session', () => {
    http.post('http://localhost:5218/api/User/login', {}).subscribe({ error: () => undefined });
    const request = httpTestingController.expectOne('http://localhost:5218/api/User/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(sessionStorage.getItem(AUTH_EXPIRED_NOTICE_KEY)).toBeNull();
  });
});
