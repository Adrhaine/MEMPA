import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AdminPlaylist {
  _id: string;
  name: string;
  creator: string;
  style: string;
  clicks: number;
  songs: any[];
  createdAt: string;
}

export interface AdminStats {
  keyMetrics: {
    totalUsers: number;
    totalPlaylists: number;
    totalSongs: number;
    totalViews: number;
    avgSongs: number;
    mostPopularStyle: string;
    topContributor: { name: string; count: number } | null;
  };
  styleStats: { _id: string; count: number; totalViews: number }[];
  topPlaylists: { _id: string; name: string; clicks: number; style: string }[];
  topLikedPlaylists: { _id: string; name: string; style: string; likesCount: number }[];
  creationsOverTime: { _id: string; count: number }[];
  topArtists: { _id: string; count: number }[];
}

export interface AdminPaginatedPlaylists {
  playlists: AdminPlaylist[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  private apiUrl = 'http://localhost:3000/api/admin';

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`);
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`);
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id}`);
  }

  updateUserRole(id: string, role: 'user' | 'admin'): Observable<{ message: string; user: AdminUser }> {
    return this.http.patch<{ message: string; user: AdminUser }>(
      `${this.apiUrl}/users/${id}/role`,
      { role }
    );
  }

  getPlaylists(page: number = 1, search: string = ''): Observable<AdminPaginatedPlaylists> {
    return this.http.get<AdminPaginatedPlaylists>(
      `${this.apiUrl}/playlists?page=${page}&limit=20&search=${search}`
    );
  }

  deletePlaylist(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/playlists/${id}`);
  }

  addStyle(name: string, color1: string, color2: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/styles`, { name, color1, color2 });
  }

  deleteStyle(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/styles/${id}`);
  }
}
