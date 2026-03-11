import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist.service';
import { AuthService } from '../../services/auth.service';
import { Playlist } from '../../models/playlist.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-playlist-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './playlist-list.component.html',
  styleUrl: './playlist-list.component.css'
})
export class PlaylistListComponent implements OnInit {
  playlists: Playlist[] = [];
  searchTerm: string = '';
  sortBy: string = '';
  order: string = 'asc';

  constructor(
    private playlistService: PlaylistService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPlaylists();
  }

  loadPlaylists(): void {
    this.playlistService.getAll(this.searchTerm, this.sortBy, this.order).subscribe((data: Playlist[]) => {
      this.playlists = data;
      this.cdr.detectChanges();
    });
  }

  onSearch(): void { this.loadPlaylists(); }

  onSort(field: string): void {
    this.sortBy === field
      ? this.order = this.order === 'asc' ? 'desc' : 'asc'
      : (this.sortBy = field, this.order = 'asc');
    this.loadPlaylists();
  }

  onReset(): void {
    this.searchTerm = '';
    this.sortBy = '';
    this.order = 'asc';
    this.loadPlaylists();
  }

  // Vérifie si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Récupère le nom de l'utilisateur connecté
  getUsername(): string {
    return this.authService.getCurrentUser()?.username || '';
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToDetail(id: string): void { this.router.navigate(['/playlist', id]); }
  goToCreate(): void { this.router.navigate(['/create']); }
  goToLogin(): void { this.router.navigate(['/login']); }

  // Retourne la classe CSS du gradient en fonction du style de musique
  getGradientClass(style: string): string {
    const normalizedStyle = style.toLowerCase().trim();

    if (normalizedStyle.includes('electro') || normalizedStyle.includes('electronic')) {
      return 'gradient-electro';
    } else if (normalizedStyle.includes('rock')) {
      return 'gradient-rock';
    } else if (normalizedStyle.includes('jazz')) {
      return 'gradient-jazz';
    } else if (normalizedStyle.includes('classique') || normalizedStyle.includes('classical')) {
      return 'gradient-classique';
    } else if (normalizedStyle.includes('pop')) {
      return 'gradient-pop';
    } else if (normalizedStyle.includes('hip-hop') || normalizedStyle.includes('hip hop') || normalizedStyle.includes('rap')) {
      return 'gradient-hiphop';
    } else {
      return 'gradient-default';
    }
  }
}
