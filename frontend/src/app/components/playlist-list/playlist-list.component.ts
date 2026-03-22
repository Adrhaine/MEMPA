import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist.service';
import { AuthService } from '../../services/auth.service';
import { Playlist } from '../../models/playlist.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StyleService } from '../../services/style.service';
import { NotificationService } from '../../services/notification.service';

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
    private styleService: StyleService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.playlistService.getStyles().subscribe({
      next: (styles: string[]) => {
        this.availableStyles = styles;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notificationService.error('Erreur lors du chargement des styles');
      }
    });
    this.loadPlaylists();
  }

  loadPlaylists(): void {
    this.playlistService.getAll(this.searchTerm, this.sortBy, this.order, this.selectedStyles).subscribe({
      next: (data: Playlist[]) => {
        this.playlists = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notificationService.error('Impossible de charger les playlists, veuillez réessayer');
      }
    });
  }

  onStyleToggle(style: string): void {
    const index = this.selectedStyles.indexOf(style);
    if (index === -1) {
      this.selectedStyles.push(style);
    } else {
      this.selectedStyles.splice(index, 1);
    }
    this.loadPlaylists();
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

  isLoggedIn(): boolean { return this.authService.isLoggedIn(); }
  getUsername(): string { return this.authService.getCurrentUser()?.username || ''; }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToDetail(id: string): void { this.router.navigate(['/playlist', id]); }
  goToCreate(): void { this.router.navigate(['/create']); }
  goToLogin(): void { this.router.navigate(['/login']); }

  getGradientClass(style: string): string {
    return this.styleService.getGradientClass(style);
  }
}
