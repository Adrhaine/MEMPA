import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlaylistService } from '../../services/playlist.service';
import { Playlist, Song } from '../../models/playlist.model';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-create-playlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-playlist.component.html',
  styleUrl: './create-playlist.component.css'
})
export class CreatePlaylistComponent implements OnInit {
  playlist: Playlist = {
    name: '',
    creator: '',
    clicks: 0,
    songs: [],
    contributors: [],
    style: ''
  };

  newSong: Song = { title: '', artist: '' };

  constructor(
    private playlistService: PlaylistService,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.playlist.creator = user.username;
    }
  }

  addSong(): void {
    if (!this.newSong.title || !this.newSong.artist) {
      this.notificationService.error('Veuillez remplir le titre et l\'artiste');
      return;
    }
    this.playlist.songs.push({ ...this.newSong });
    this.newSong = { title: '', artist: '' };
  }

  removeSong(index: number): void {
    this.playlist.songs.splice(index, 1);
  }

  submit(): void {
    if (!this.playlist.name || !this.playlist.style) {
      this.notificationService.error('Veuillez remplir le nom et le style de la playlist');
      return;
    }
    this.playlistService.create(this.playlist).subscribe({
      next: () => {
        this.notificationService.success('Playlist crée avec succès !');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Erreur lors de la création');
      }
    });
  }


  goBack(): void {
    this.router.navigate(['/']);
  }
}
