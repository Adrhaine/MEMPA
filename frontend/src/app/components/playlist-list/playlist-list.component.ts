import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist.service';
import { AuthService } from '../../services/auth.service';
import {Playlist, Style} from '../../models/playlist.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StyleService } from '../../services/style.service';
import { NotificationService } from '../../services/notification.service';
import { PaginatedPlaylists } from '../../services/playlist.service';
import { ParticlesComponent } from '../particles/particles.component';

@Component({
  selector: 'app-playlist-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ParticlesComponent],
  templateUrl: './playlist-list.component.html',
  styleUrl: './playlist-list.component.css'
})
export class PlaylistListComponent implements OnInit {
  playlists: Playlist[] = [];
  searchTerm: string = '';
  sortBy: string = '';
  order: string = 'asc';
  availableStyles: Style[] = [];
  selectedStyles: string[] = [];

  currentPage: number = 1;
  totalPages: number = 1;
  totalPlaylists: number = 0;
  readonly limit: number = 8;

  constructor(
    private playlistService: PlaylistService,
    private authService: AuthService,
    public router: Router,
    private cdr: ChangeDetectorRef,
    private styleService: StyleService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.styleService.getAll().subscribe({
      next: (styles: Style[]) => {
        this.availableStyles = styles;
        this.styleService.setCache(styles);
        this.cdr.detectChanges();
      },
      error: () => {
        this.notificationService.error('Erreur lors du chargement des styles');
      }
    });
    this.loadPlaylists();
  }

  loadPlaylists(): void {
    this.playlistService.getAll(this.searchTerm, this.sortBy, this.order, this.selectedStyles, this.currentPage, this.limit ).subscribe({
      next: (data: PaginatedPlaylists) => {
        this.playlists = data.playlists;
        this.totalPages = data.totalPages;
        this.totalPlaylists = data.total;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notificationService.error('Impossible de charger les playlists, veuillez réessayer');
      }
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadPlaylists();
    // Remonte en haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToProfile(): void { this.router.navigate(['/profile']); }

  onStyleToggle(style: string): void {
    const index = this.selectedStyles.indexOf(style);
    if (index === -1) {
      this.selectedStyles.push(style);
    } else {
      this.selectedStyles.splice(index, 1);
    }
    this.currentPage = 1;
    this.loadPlaylists();
  }

  isStyleSelected(style: string): boolean {
    return this.selectedStyles.includes(style);
  }

  onSearch(): void { this.currentPage = 1; this.loadPlaylists(); }

  onSort(field: string): void {
    this.sortBy === field
      ? this.order = this.order === 'asc' ? 'desc' : 'asc'
      : (this.sortBy = field, this.order = 'asc');
    this.currentPage = 1;
    this.loadPlaylists();
  }

  onReset(): void {
    this.searchTerm = '';
    this.sortBy = '';
    this.order = 'asc';
    this.selectedStyles = [];
    this.loadPlaylists();
    this.currentPage = 1;
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    if (this.totalPages <= 7) {
      // Peu de pages → on affiche tout
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else {
      // Beaucoup de pages → on affiche avec des "..."
      pages.push(1);
      if (this.currentPage > 3) pages.push('...');
      for (let i = Math.max(2, this.currentPage - 1); i <= Math.min(this.totalPages - 1, this.currentPage + 1); i++) {
        pages.push(i);
      }
      if (this.currentPage < this.totalPages - 2) pages.push('...');
      pages.push(this.totalPages);
    }
    return pages;
  }

  isLoggedIn(): boolean { return this.authService.isLoggedIn(); }
  getUsername(): string { return this.authService.getCurrentUser()?.username || ''; }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToDetail(id: string): void { this.router.navigate(['/playlist', id]); }
  goToStats(): void { this.router.navigate(['/stats']); }
  goToCreate(): void { this.router.navigate(['/create']); }
  goToLogin(): void { this.router.navigate(['/login']); }

  getGradientStyle(style: string): { [key: string]: string } {
    return this.styleService.getGradientStyle(style);
  }

  isAdmin(): boolean { return this.authService.isAdmin(); }

}
