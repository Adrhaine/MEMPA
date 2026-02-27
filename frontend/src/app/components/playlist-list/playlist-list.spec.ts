import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistList } from './playlist-list';

describe('PlaylistList', () => {
  let component: PlaylistList;
  let fixture: ComponentFixture<PlaylistList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaylistList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaylistList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
