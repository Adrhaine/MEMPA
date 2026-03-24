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

  // Fichier image sélectionné par l'utilisateur
  coverFile: File | null = null;
  // URL temporaire pour la prévisualisation dans le navigateur
  coverPreviewUrl: string | null = null;

  constructor(
    private playlistService: PlaylistService,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private styleService: StyleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.playlist.creator = user.username;
    }

    this.styleService.getAll().subscribe({
      next: (styles) => {
        this.availableStyles = styles;
        this.cdr.detectChanges();
      },
      error: () => this.notificationService.error('Impossible de charger les styles')
    });
  }

  // Déclenché quand l'utilisateur choisit un fichier
  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Vérification de la taille côté client (5 Mo max)
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.error('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    this.coverFile = file;

    // createObjectURL crée une URL temporaire locale pour afficher
    this.coverPreviewUrl = URL.createObjectURL(file);
    this.cdr.detectChanges();
  }

  // Supprime la sélection -> retour au gradient
  removeCover(): void {
    this.coverFile = null;
    // On libère la mémoire de l'URL temporaire
    if (this.coverPreviewUrl) {
      URL.revokeObjectURL(this.coverPreviewUrl);
      this.coverPreviewUrl = null;
    }
    this.cdr.detectChanges();
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

    // On passe le fichier (ou null si aucun) au service
    this.playlistService.create(this.playlist, this.coverFile ?? undefined).subscribe({
      next: () => {
        this.notificationService.success('Playlist créée avec succès !');
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
