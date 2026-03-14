import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist.service';
import { Playlist } from '../../models/playlist.model';
import { CommonModule } from '@angular/common';
import { StyleService } from '../../services/style.service';

@Component({
  selector: 'app-playlist-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './playlist-detail.component.html',
  styleUrl: './playlist-detail.component.css'
})
export class PlaylistDetailComponent implements OnInit {
  playlist: Playlist | null = null;

  constructor(
    private route: ActivatedRoute,
    private playlistService: PlaylistService,
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
        error: () => this.router.navigate(['/']) // redirige si playlist introuvable
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  // Retourne la classe CSS du gradient en fonction du style de musique
  getGradientClass(style: string): string {
    return this.styleService.getGradientClass(style);
  }
}
