import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlaylistListComponent } from './playlist-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('PlaylistListComponent', () => {
  let component: PlaylistListComponent;
  let fixture: ComponentFixture<PlaylistListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PlaylistListComponent,
        HttpClientTestingModule, // Ajoute les faux outils réseau
        RouterTestingModule      // Ajoute les faux outils de navigation
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaylistListComponent);
    component = fixture.componentInstance;
    
    // On force la détection des changements pour initialiser le composant
    fixture.detectChanges(); 
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });
});