import { TestBed } from '@angular/core/testing';
import { PlaylistService } from './playlist.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Toujours avec describe.only pour isoler le test Vitest
describe.only('PlaylistService', () => {
  let service: PlaylistService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule] // On simule les appels au backend
    });
    service = TestBed.inject(PlaylistService);
  });

  it('devrait créer le service', () => {
    expect(service).toBeTruthy();
  });
});
