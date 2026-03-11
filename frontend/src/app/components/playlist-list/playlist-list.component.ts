import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist.service';
import { AuthService } from '../../services/auth.service';
import { Playlist } from '../../models/playlist.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StyleService } from '../../services/style.service';

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

  availableStyles: string[] = [];
  selectedStyles: string[] = [];

  constructor(
    private playlistService: PlaylistService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private styleService: StyleService
  ) {}

  ngOnInit(): void {
    // On charge les styles disponibles au démarrage
    this.playlistService.getStyles().subscribe((styles: string[]) => {
      this.availableStyles = styles;
      this.cdr.detectChanges();
    });
    this.loadPlaylists();
  }

  onStyleToggle(style: string): void {
    const index = this.selectedStyles.indexOf(style);
    if (index === -1) {
      // Pas encore coché → on l'ajoute
      this.selectedStyles.push(style);
    } else {
      // Déjà coché → on le retire
      this.selectedStyles.splice(index, 1);
    }
    this.loadPlaylists();
  }

  loadPlaylists(): void {
    this.playlistService.getAll(this.searchTerm, this.sortBy, this.order, this.selectedStyles).subscribe((data: Playlist[]) => {
      this.playlists = data;
      this.cdr.detectChanges();
    });
  }

  isStyleSelected(style: string): boolean {
    return this.selectedStyles.includes(style);
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
    this.selectedStyles = [];
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
    return this.styleService.getGradientClass(style);
  }
}
