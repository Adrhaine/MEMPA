import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist.service';
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

  // Paramètres de tri et recherche
  searchTerm: string = '';
  sortBy: string = '';
  order: string = 'asc';

  constructor(
    private playlistService: PlaylistService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPlaylists();
  }

  // Charge les playlists avec les paramètres actuels
  loadPlaylists(): void {
    this.playlistService.getAll(this.searchTerm, this.sortBy, this.order).subscribe((data: Playlist[]) => {
      this.playlists = data;
      this.cdr.detectChanges();
    });
  }

  // Appelé quand l'utilisateur tape dans la barre de recherche
  onSearch(): void {
    this.loadPlaylists();
  }

  // Appelé quand l'utilisateur clique sur un bouton de tri
  onSort(field: string): void {
    if (this.sortBy === field) {
      // Si on clique sur le même champ → on inverse l'ordre
      this.order = this.order === 'asc' ? 'desc' : 'asc';
    } else {
      // Nouveau champ → tri croissant par défaut
      this.sortBy = field;
      this.order = 'asc';
    }
    this.loadPlaylists();
  }

  // Réinitialise tout
  onReset(): void {
    this.searchTerm = '';
    this.sortBy = '';
    this.order = 'asc';
    this.loadPlaylists();
  }

  goToDetail(id: string): void {
    this.router.navigate(['/playlist', id]);
  }

  goToCreate(): void {
    this.router.navigate(['/create']);
  }
}
