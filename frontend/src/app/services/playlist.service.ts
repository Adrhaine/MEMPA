import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Playlist } from '../models/playlist.model';
import { AuthService } from './auth.service';
export interface PaginatedPlaylists {
  playlists: Playlist[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private apiUrl = 'http://localhost:3000/api/playlists';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  getAll(
    search: string = '',
    sortBy: string = '',
    order: string = 'asc',
    selectedStyles: string[] = [],
    page: number = 1,
    limit: number = 8
  ): Observable<PaginatedPlaylists> {
    let params = new HttpParams();
    if (search)                    params = params.set('search', search);
    if (sortBy)                    params = params.set('sortBy', sortBy);
    if (order)                     params = params.set('order', order);
    if (selectedStyles.length > 0) params = params.set('styles', selectedStyles.join(','));
    params = params.set('page', page.toString());
    params = params.set('limit', limit.toString());

    return this.http.get<PaginatedPlaylists>(this.apiUrl, { params });
  }

  getStyles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/styles`);
  }

  getById(id: string): Observable<Playlist> {
    return this.http.get<Playlist>(`${this.apiUrl}/${id}`);
  }

  toggleLike(id: string): Observable<{ likes: number; liked: boolean }> {
    return this.http.post<{ likes: number; liked: boolean }>(
      `${this.apiUrl}/${id}/like`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  create(playlist: Playlist): Observable<Playlist> {
    return this.http.post<Playlist>(this.apiUrl, playlist, {
      headers: this.getAuthHeaders()
    });
  }

  // DELETE — créateur uniquement
  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // PATCH — tout utilisateur connecté peut ajouter des morceaux
  addSongs(id: string, songs: { title: string; artist: string }[]): Observable<Playlist> {
    return this.http.patch<Playlist>(`${this.apiUrl}/${id}/songs`, { songs }, {
      headers: this.getAuthHeaders()
    });
  }
}
