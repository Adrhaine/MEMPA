import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlaylistService } from '../../services/playlist.service';
import { Playlist, Song } from '../../models/playlist.model';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { StyleService, Style } from '../../services/style.service';

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
  availableStyles: Style[] = [];

  constructor(
    private playlistService: PlaylistService,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private styleService: StyleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Auto-fill créateur
    const user = this.authService.getCurrentUser();
    if (user) {
      this.playlist.creator = user.username;
    }

    // Chargement des styles — indépendant de l'utilisateur
    this.styleService.getAll().subscribe({
      next: (styles) => {
        this.availableStyles = styles;
        this.cdr.detectChanges();
      },
      error: () => this.notificationService.error('Impossible de charger les styles')
    });
  }

  addSong(): void {
    if (!this.newSong.title || !this.newSong.artist) {
      this.notificationService.warning('Veuillez remplir le titre et l\'artiste');
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
      this.notificationService.warning('Veuillez remplir le nom et le style de la playlist');
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
