import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PlaylistService } from '../../services/playlist.services';
import { Playlist, Song } from '../../models/playlist.model';

@Component({
  selector: 'app-create-playlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-playlist.component.html',
  styleUrl: './create-playlist.component.css'
})
export class CreatePlaylistComponent {
  playlist: Playlist = {
    name: '',
    creator: '',
    clicks: 0,
    songs: [],
    contributors: [],
    style: ''
  };

  newSong: Song = { title: '', artist: '' };

  constructor(private playlistService: PlaylistService, private router: Router) {}

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
      this.playlistService.create(this.playlist).subscribe(() => {
        this.router.navigate(['/']);
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
