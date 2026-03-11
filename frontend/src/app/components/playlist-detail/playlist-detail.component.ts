import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaylistService } from '../../services/playlist.service';
import { Playlist } from '../../models/playlist.model';
import { CommonModule } from '@angular/common';

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.playlistService.getById(id).subscribe(data => {
        this.playlist = data;
        this.cdr.detectChanges();
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  // Retourne la classe CSS du gradient en fonction du style de musique
  getGradientClass(style: string): string {
    const normalizedStyle = style.toLowerCase().trim();

    if (normalizedStyle.includes('electro') || normalizedStyle.includes('electronic')) {
      return 'gradient-electro';
    } else if (normalizedStyle.includes('rock')) {
      return 'gradient-rock';
    } else if (normalizedStyle.includes('jazz')) {
      return 'gradient-jazz';
    } else if (normalizedStyle.includes('classique') || normalizedStyle.includes('classical')) {
      return 'gradient-classique';
    } else if (normalizedStyle.includes('pop')) {
      return 'gradient-pop';
    } else if (normalizedStyle.includes('hip-hop') || normalizedStyle.includes('hip hop') || normalizedStyle.includes('rap')) {
      return 'gradient-hiphop';
    } else {
      return 'gradient-default';
    }
  }
}
