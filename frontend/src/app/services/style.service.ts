import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Style {
  _id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class StyleService {

  private apiUrl = 'http://localhost:3000/api/styles';

  constructor(private http: HttpClient) {}

  // GET — récupère tous les styles depuis la BDD
  getAll(): Observable<Style[]> {
    return this.http.get<Style[]>(this.apiUrl);
  }

  // Convertit un style musical en classe CSS de gradient
  getGradientClass(style: string): string {
    const s = style.toLowerCase().trim();
    if (s.includes('electro') || s.includes('electronic')) return 'gradient-electro';
    if (s.includes('rock'))                                  return 'gradient-rock';
    if (s.includes('jazz'))                                  return 'gradient-jazz';
    if (s.includes('classique') || s.includes('classical')) return 'gradient-classique';
    if (s.includes('pop'))                                   return 'gradient-pop';
    if (s.includes('hip-hop') || s.includes('hip hop') || s.includes('rap')) return 'gradient-hiphop';
    return 'gradient-default';
  }
}
