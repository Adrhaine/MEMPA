import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe.only('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule] // Le faux outil pour les requêtes réseau
    });
    service = TestBed.inject(AuthService);
  });

  it('devrait créer le service', () => {
    expect(service).toBeTruthy();
  });
});