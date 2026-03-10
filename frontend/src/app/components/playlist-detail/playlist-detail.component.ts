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
}
