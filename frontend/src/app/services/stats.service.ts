import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KeyMetrics {
  totalPlaylists: number;
  totalSongs: number;
  totalViews: number;
  avgSongs: number;
  mostPopularStyle: string;
  topContributor: { name: string; count: number } | null;
}

export interface StyleStat {
  _id: string;
  count: number;
  totalViews: number;
}

export interface TopPlaylist {
  _id: string;
  name: string;
  clicks: number;
}

export interface SongsByPlaylist {
  _id: string;
  name: string;
  songCount: number;
}

export interface CreationOverTime {
  _id: string;
  count: number;
}

export interface Stats {
  keyMetrics: KeyMetrics;
  styleStats: StyleStat[];
  topPlaylists: TopPlaylist[];
  songsByPlaylist: SongsByPlaylist[];
  creationsOverTime: CreationOverTime[];
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private apiUrl = 'http://localhost:3000/api/stats';

  constructor(private http: HttpClient) {}

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(this.apiUrl);
  }
}
