import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist.service';
import { AuthService } from '../../services/auth.service';
import { Playlist, Song } from '../../models/playlist.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StyleService } from '../../services/style.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';

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

  // Pour la modification de pochette
  coverPreviewUrl: string | null = null;
  showCoverMenu: boolean = false;
  isEditingName: boolean = false;
  editedName: string = '';

  constructor(
    private route: ActivatedRoute,
    private playlistService: PlaylistService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private styleService: StyleService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.playlistService.getById(id).subscribe({
        next: (data) => {
          this.playlist = data;
          this.likesCount = data.likes?.length ?? 0;
          this.isLiked = this.checkIfLiked(data);
          this.cdr.detectChanges();
        },
        error: () => this.router.navigate(['/'])
      });
    }

    // Recharge les styles en cache (utile en cas de rafraîchissement de la page)
    this.styleService.getAll().subscribe({
      next: (styles) => {
        this.styleService.setCache(styles);
        this.cdr.detectChanges(); // On force la mise à jour visuelle une fois les couleurs chargées
      }
    });
  }

  isLoggedIn(): boolean { return this.authService.isLoggedIn(); }

  // Vérifie si l'utilisateur a le droit de modifier (Créateur OU Admin)
  canEdit(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.playlist) return false;
    return this.playlist.createdBy === currentUser.id || currentUser.role === 'admin';
  }

  toggleAddSongForm(): void {
    this.showAddSongForm = !this.showAddSongForm;
    this.newSong = { title: '', artist: '' };
  }

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
        if (err.status !== 401 && err.status !== 403) {
          this.notificationService.error(err.error?.message || 'Erreur lors de l\'ajout');
        }
      }
    });
  }

  startEditName(): void {
    this.editedName = this.playlist!.name;
    this.isEditingName = true;
    this.showCoverMenu = false;
  }

  cancelEditName(): void {
    this.isEditingName = false;
    this.editedName = '';
  }

  submitRename(): void {
    if (!this.editedName.trim()) {
      this.notificationService.warning('Le nom ne peut pas être vide');
      return;
    }
    if (this.editedName.trim() === this.playlist!.name) {
      this.isEditingName = false;
      return;
    }
    this.playlistService.rename(this.playlist!._id!, this.editedName.trim()).subscribe({
      next: (updatedPlaylist) => {
        this.playlist = updatedPlaylist;
        this.isEditingName = false;
        this.notificationService.success('Playlist renommée !');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Erreur lors du renommage');
      }
    });
  }

  // Déclenché quand le créateur choisit une nouvelle image
  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.warning('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    // Prévisualisation immédiate avant l'envoi
    this.coverPreviewUrl = URL.createObjectURL(file);
    this.cdr.detectChanges();

    // Upload immédiat dès la sélection
    this.playlistService.updateCover(this.playlist!._id!, file).subscribe({
      next: (updatedPlaylist) => {
        this.playlist = updatedPlaylist;
        // On libère l'URL temporaire, l'image réelle est maintenant en base
        URL.revokeObjectURL(this.coverPreviewUrl!);
        this.coverPreviewUrl = null;
        this.showCoverMenu = false;
        this.notificationService.success('Pochette mise à jour !');
        this.cdr.detectChanges();
      },
      error: () => {
        this.coverPreviewUrl = null;
        this.notificationService.error('Erreur lors de l\'upload');
        this.cdr.detectChanges();
      }
    });
  }

  // Supprime la pochette, retour au gradient
  onRemoveCover(): void {
    this.confirmService.ask(
      'Voulez-vous vraiment supprimer cette pochette ? La playlist retrouvera son dégradé de couleurs par défaut.',
      () => {
        this.playlistService.updateCover(this.playlist!._id!, null).subscribe({
          next: (updatedPlaylist) => {
            this.playlist = updatedPlaylist;
            this.showCoverMenu = false;
            this.notificationService.success('Pochette supprimée avec succès');
            this.cdr.detectChanges();
          },
          error: () => this.notificationService.error('Erreur lors de la suppression')
        });
      }
    );
  }

  onRemoveSong(index: number, event: Event): void {
    event.stopPropagation(); // Évite de déclencher d'autres clics si la ligne entière est cliquable

    this.confirmService.ask(
      'Voulez-vous vraiment retirer ce morceau de la playlist ?',
      () => {
        this.playlistService.removeSong(this.playlist!._id!, index).subscribe({
          next: (updatedPlaylist) => {
            this.playlist = updatedPlaylist;
            this.notificationService.success('Morceau retiré avec succès');
            this.cdr.detectChanges();
          },
          error: (err) => this.notificationService.error(err.error?.message || 'Erreur lors de la suppression')
        });
      }
    );
  }

  // Retourne l'URL complète de l'image ou null
  getCoverUrl(): string | null {
    if (this.coverPreviewUrl) return this.coverPreviewUrl;
    if (this.playlist?.coverImage) return this.playlist.coverImage;
    return null;
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
