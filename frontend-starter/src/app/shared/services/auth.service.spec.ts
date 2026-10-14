import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth-response.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('devrait envoyer une requête POST /api/auth/login avec email et password et sauvegarder le token', () => {
    const mockCredentials = { email: 'test@etu.unice.fr', password: 'password123' };
    const mockResponse: AuthResponse = {
      token: 'jwt-token-xyz',
      user: {
        id: 'u1',
        email: 'test@etu.unice.fr',
        name: 'Valentin',
        createdAt: '2026-10-14T10:00:00.000Z',
      },
    };

    service.login(mockCredentials.email, mockCredentials.password).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(service.token()).toBe('jwt-token-xyz');
      expect(service.currentUser()?.name).toBe('Valentin');
    });

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockCredentials);

    req.flush(mockResponse);
  });
});
