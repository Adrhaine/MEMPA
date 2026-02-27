import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist';
import { Playlist } from '../../models/playlist.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-playlist-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playlist-list.html',
  styleUrl: './playlist-list.css'
})
export class PlaylistListComponent implements OnInit {
  playlists: Playlist[] = [];

  constructor(
    private playlistService: PlaylistService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.playlistService.getAll().subscribe(data => {
      console.log('Données reçues:', data);
      this.playlists = data;
      this.cdr.detectChanges();
    });
  }

  goToDetail(id: string): void {
    this.router.navigate(['/playlist', id]);
  }

  goToCreate(): void {
    this.router.navigate(['/create']);
  }
}
