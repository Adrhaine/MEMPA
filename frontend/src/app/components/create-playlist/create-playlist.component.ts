import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlaylistService } from '../../services/playlist.service';
import { Playlist, Song } from '../../models/playlist.model';
import { AuthService } from '../../services/auth.service';

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

  errorMessage: string = '';

  constructor(
    private playlistService: PlaylistService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.playlist.creator = user.username;
    }
  }

  addSong(): void {
    if (this.newSong.title && this.newSong.artist) {
      this.playlist.songs.push({ ...this.newSong });
      this.newSong = { title: '', artist: '' };
    }
  }

  removeSong(index: number): void {
    this.playlist.songs.splice(index, 1);
  }

  submit(): void {
    if (this.playlist.name && this.playlist.creator && this.playlist.style) {
      this.playlistService.create(this.playlist).subscribe({
        next: () => this.router.navigate(['/']),
        error: (err) => {
          this.errorMessage = err.error?.message || 'Erreur lors de la création';
          this.cdr.detectChanges();
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
