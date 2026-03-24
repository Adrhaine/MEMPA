import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  getById(id: string): Observable<Playlist> {
    return this.http.get<Playlist>(`${this.apiUrl}/${id}`);
  }

  toggleLike(id: string): Observable<{ likes: number; liked: boolean }> {
    return this.http.post<{ likes: number; liked: boolean }>(
      `${this.apiUrl}/${id}/like`,
      {},
    );
  }

  // GET — playlists créées par l'utilisateur connecté
  getMyPlaylists(): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(`${this.apiUrl}/my`);
  }

// GET — playlists likées par l'utilisateur connecté
  getLikedPlaylists(): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(`${this.apiUrl}/liked`);
  }

  create(playlist: Playlist, coverFile?: File): Observable<Playlist> {
    const formData = new FormData();
    formData.append('name', playlist.name);
    formData.append('creator', playlist.creator);
    formData.append('style', playlist.style);
    formData.append('songs', JSON.stringify(playlist.songs));

    // On n'ajoute le fichier que s'il existe
    if (coverFile) {
      formData.append('cover', coverFile);
    }

    return this.http.post<Playlist>(this.apiUrl, formData);
  }

  updateCover(id: string, coverFile: File): Observable<Playlist> {
    const formData = new FormData();
    formData.append('cover', coverFile);
    return this.http.patch<Playlist>(`${this.apiUrl}/${id}/cover`, formData);
  }

  removeCover(id: string): Observable<Playlist> {
    const formData = new FormData();
    formData.append('removeCover', 'true');
    return this.http.patch<Playlist>(`${this.apiUrl}/${id}/cover`, formData);
  }

  rename(id: string, name: string): Observable<Playlist> {
    return this.http.patch<Playlist>(`${this.apiUrl}/${id}/rename`, { name });
  }

  // DELETE — créateur uniquement
  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
    });
  }

  // PATCH — tout utilisateur connecté peut ajouter des morceaux
  addSongs(id: string, songs: { title: string; artist: string }[]): Observable<Playlist> {
    return this.http.patch<Playlist>(`${this.apiUrl}/${id}/songs`, { songs }, {
    });
  }

  // DELETE — supprimer un morceau spécifique
  removeSong(id: string, songIndex: number): Observable<Playlist> {
    return this.http.delete<Playlist>(`${this.apiUrl}/${id}/songs/${songIndex}`);
  }
}
