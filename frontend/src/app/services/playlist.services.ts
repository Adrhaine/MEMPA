import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Playlist } from '../models/playlist.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private apiUrl = 'http://localhost:3000/api/playlists';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Crée les headers avec le token JWT
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  // GET — pas besoin de token, tout le monde peut voir les playlists
  getAll(): Observable<Playlist[]> {
    return this.http.get<Playlist[]>(this.apiUrl);
  }

  // GET — pas besoin de token
  getById(id: string): Observable<Playlist> {
    return this.http.get<Playlist>(`${this.apiUrl}/${id}`);
  }

  // POST — route protégée, on envoie le token
  create(playlist: Playlist): Observable<Playlist> {
    return this.http.post<Playlist>(this.apiUrl, playlist, {
      headers: this.getAuthHeaders()
    });
  }
}
