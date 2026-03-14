import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist.service';
import { AuthService } from '../../services/auth.service';
import { Playlist, Song } from '../../models/playlist.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StyleService } from '../../services/style.service';


@Component({
  selector: 'app-playlist-detail',
  standalone: true,
  imports: [CommonModule, FormsModule], // FormsModule ajouté pour le formulaire d'ajout
  templateUrl: './playlist-detail.component.html',
  styleUrl: './playlist-detail.component.css'
})
export class PlaylistDetailComponent implements OnInit {
  playlist: Playlist | null = null;


  // Contrôle l'affichage du formulaire d'ajout de morceau
  showAddSongForm: boolean = false;

  // Modèle lié au formulaire d'ajout
  newSong: Song = { title: '', artist: '' };

  // Messages de feedback utilisateur
  errorMessage: string = '';
  successMessage: string = '';

  // Contrôle l'affichage de la modale de confirmation de suppression
  showDeleteConfirm: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private playlistService: PlaylistService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private styleService: StyleService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.playlistService.getById(id).subscribe({
        next: (data) => {
          this.playlist = data;
          this.cdr.detectChanges();
        },
        error: () => this.router.navigate(['/'])
      });
    }
  }

  // Vérifie si l'utilisateur est connecté
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Vérifie si l'utilisateur connecté est le créateur de cette playlist
  isCreator(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.playlist) return false;
    return this.playlist.createdBy === currentUser.id;
  }

  // Ouvre/ferme le formulaire et réinitialise les champs
  toggleAddSongForm(): void {
    this.showAddSongForm = !this.showAddSongForm;
    this.newSong = { title: '', artist: '' };
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Envoie le nouveau morceau au backend
  onAddSong(): void {
    if (!this.newSong.title || !this.newSong.artist) {
      this.errorMessage = 'Veuillez remplir le titre et l\'artiste';
      return;
    }

    this.playlistService.addSongs(this.playlist!._id!, [this.newSong]).subscribe({
      next: (updatedPlaylist) => {
        this.playlist = updatedPlaylist;
        this.newSong = { title: '', artist: '' };
        this.successMessage = 'Morceau ajouté avec succès !';
        this.errorMessage = '';
        this.showAddSongForm = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de l\'ajout';
      }
    });
  }

  openDeleteConfirm(): void  { this.showDeleteConfirm = true; }
  cancelDelete(): void       { this.showDeleteConfirm = false; }

  confirmDelete(): void {
    this.playlistService.delete(this.playlist!._id!).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors de la suppression';
        this.showDeleteConfirm = false;
      }
    });
  }

  goBack(): void { this.router.navigate(['/']); }

  getGradientClass(style: string): string {
    return this.styleService.getGradientClass(style);
  }
}
