import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TrackService } from './track.service';
import { Page } from '../models/page.model';
import { Track } from '../models/track.model';

describe('TrackService', () => {
  let service: TrackService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrackService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TrackService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('devrait transmettre les paramètres page et limit lors de list()', () => {
    const mockPage: Page<Track> = {
      items: [
        {
          id: 'track-1',
          title: 'Morceau Test',
          originalName: 'test.mp3',
          mimeType: 'audio/mpeg',
          size: 2048,
          createdAt: '2026-10-14T10:00:00.000Z',
        },
      ],
      total: 1,
      page: 2,
      pages: 1,
      limit: 4,
    };

    service.list(2, 4).subscribe((response) => {
      expect(response).toEqual(mockPage);
      expect(response.items.length).toBe(1);
    });

    const req = httpMock.expectOne('/api/tracks?page=2&limit=4');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('4');

    req.flush(mockPage);
  });

  it('devrait exécuter une requête DELETE vers /api/tracks/:id', () => {
    const trackId = 'track-456';

    service.delete(trackId).subscribe();

    const req = httpMock.expectOne(`/api/tracks/${trackId}`);
    expect(req.request.method).toBe('DELETE');

    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
