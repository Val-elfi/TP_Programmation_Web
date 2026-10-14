import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const mockToken = signal<string | null>(null);

  beforeEach(() => {
    mockToken.set(null);

    const authServiceStub = {
      token: mockToken.asReadonly(),
      logout: () => mockToken.set(null),
    };

    const routerStub = {
      navigateByUrl: () => Promise.resolve(true),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait injecter le header Authorization: Bearer <token> si un token est présent', () => {
    const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummyPayload';
    mockToken.set(fakeJwt);

    http.get('/api/protected-resource').subscribe();

    const req = httpMock.expectOne('/api/protected-resource');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${fakeJwt}`);

    req.flush({});
  });

  it('ne devrait pas injecter de header Authorization si aucun token n\'est disponible', () => {
    mockToken.set(null);

    http.get('/api/public-resource').subscribe();

    const req = httpMock.expectOne('/api/public-resource');
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({});
  });
});
