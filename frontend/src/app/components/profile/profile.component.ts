import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PlaylistService } from '../../services/playlist.service';
import { StyleService } from '../../services/style.service';
import { NotificationService } from '../../services/notification.service';
import { Playlist } from '../../models/playlist.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  // Données utilisateur
  username: string = '';
  email: string = '';
  newUsername: string = '';
  showEditForm: boolean = false;

  // Playlists
  myPlaylists: Playlist[] = [];
  likedPlaylists: Playlist[] = [];

  // Onglet actif : 'my' ou 'liked'
  activeTab: string = 'my';

  constructor(
    private authService: AuthService,
    private playlistService: PlaylistService,
    private styleService: StyleService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.username = user.username;
    this.email = user.email;
    this.newUsername = user.username;

    this.loadMyPlaylists();
    this.loadLikedPlaylists();

    // Charge les styles en cache pour les gradients
    this.styleService.getAll().subscribe({
      next: (styles) => this.styleService.setCache(styles)
    });
  }

  loadMyPlaylists(): void {
    this.playlistService.getMyPlaylists().subscribe({
      next: (data) => {
        this.myPlaylists = data;
        this.cdr.detectChanges();
      },
      error: () => this.notificationService.error('Erreur lors du chargement de vos playlists')
    });
  }

  loadLikedPlaylists(): void {
    this.playlistService.getLikedPlaylists().subscribe({
      next: (data) => {
        this.likedPlaylists = data;
        this.cdr.detectChanges();
      },
      error: () => this.notificationService.error('Erreur lors du chargement des playlists likées')
    });
  }

  onUpdateUsername(): void {
    if (!this.newUsername || this.newUsername.trim() === '') {
      this.notificationService.error('Le pseudo ne peut pas être vide');
      return;
    }
    if (this.newUsername === this.username) {
      this.showEditForm = false;
      return;
    }

    this.authService.updateUsername(this.newUsername).subscribe({
      next: (res) => {
        this.username = res.user.username;
        this.showEditForm = false;
        this.notificationService.success('Pseudo modifié avec succès !');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Erreur lors de la modification');
      }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  goToDetail(id: string): void { this.router.navigate(['/playlist', id]); }
  goBack(): void { this.router.navigate(['/']); }

  getGradientStyle(style: string): { [key: string]: string } {
    return this.styleService.getGradientStyle(style);
  }
}
