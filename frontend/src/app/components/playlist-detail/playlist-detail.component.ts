import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist.service';
import { AuthService } from '../../services/auth.service';
import { Playlist, Song } from '../../models/playlist.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StyleService } from '../../services/style.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-playlist-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './playlist-detail.component.html',
  styleUrl: './playlist-detail.component.css'
})
export class PlaylistDetailComponent implements OnInit {
  playlist: Playlist | null = null;
  showAddSongForm: boolean = false;
  newSong: Song = { title: '', artist: '' };
  showDeleteConfirm: boolean = false;

  likesCount: number = 0;
  isLiked: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private playlistService: PlaylistService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private styleService: StyleService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.playlistService.getById(id).subscribe({
        next: (data) => {
          this.playlist = data;
          // Initialise le compteur et l'état du like
          this.likesCount = data.likes?.length ?? 0;
          this.isLiked = this.checkIfLiked(data);
          this.cdr.detectChanges();
        },
        error: () => this.router.navigate(['/'])
      });
    }
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isCreator(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.playlist) return false;
    return this.playlist.createdBy === currentUser.id;
  }

  toggleAddSongForm(): void {
    this.showAddSongForm = !this.showAddSongForm;
    this.newSong = { title: '', artist: '' };
  }

  // Vérifie si l'utilisateur connecté a déjà liké
  checkIfLiked(playlist: Playlist): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !playlist.likes) return false;
    return playlist.likes.includes(currentUser.id);
  }

  onToggleLike(): void {
    if (!this.playlist?._id) return;

    this.playlistService.toggleLike(this.playlist._id).subscribe({
      next: (res) => {
        this.likesCount = res.likes;
        this.isLiked = res.liked;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status !== 401 && err.status !== 403) {
          this.notificationService.error('Erreur lors du like');
        }
      }
    });
  }

  onAddSong(): void {
    if (!this.newSong.title || !this.newSong.artist) {
      this.notificationService.warning('Veuillez remplir le titre et l\'artiste');
      return;
    }

    this.playlistService.addSongs(this.playlist!._id!, [this.newSong]).subscribe({
      next: (updatedPlaylist) => {
        this.playlist = updatedPlaylist;
        this.newSong = { title: '', artist: '' };
        this.showAddSongForm = false;
        this.notificationService.success('Morceau ajouté avec succès !');
        this.cdr.detectChanges();
      },
      error: (err) => {
        // L'interceptor gère déjà les 401/403
        if (err.status !== 401 && err.status !== 403) {
          this.notificationService.error(err.error?.message || 'Erreur lors de l\'ajout');
        }
      }
    });
  }

  openDeleteConfirm(): void  { this.showDeleteConfirm = true; }
  cancelDelete(): void       { this.showDeleteConfirm = false; }

  confirmDelete(): void {
    this.playlistService.delete(this.playlist!._id!).subscribe({
      next: () => {
        this.notificationService.success('Playlist supprimée !');
        this.router.navigate(['/']);
      },
      error: (err) => {
        // L'interceptor gère déjà les 401/403
        if (err.status !== 401 && err.status !== 403) {
          this.notificationService.error(err.error?.message || 'Erreur lors de la suppression');
        }
        this.showDeleteConfirm = false;
      }
    });
  }

  goBack(): void { this.router.navigate(['/']); }

  getGradientStyle(style: string): { [key: string]: string } {
    return this.styleService.getGradientStyle(style);
  }
}
