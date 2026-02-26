import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Playlist } from '../models/playlist.model';

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private apiUrl = 'http://localhost:3000/api/playlists';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(this.apiUrl);
  }

  getById(id: string): Observable<Playlist> {
    return this.http.get<Playlist>(`${this.apiUrl}/${id}`);
  }

  create(playlist: Playlist): Observable<Playlist> {
    return this.http.post<Playlist>(this.apiUrl, playlist);
  }
}
