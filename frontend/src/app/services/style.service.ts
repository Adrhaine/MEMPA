import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Style } from '../models/playlist.model';

export type { Style };

@Injectable({ providedIn: 'root' })
export class StyleService {

  private apiUrl = 'http://localhost:3000/api/styles';

  // Cache local des styles pour éviter des appels répétés
  private stylesCache: Style[] = [];

  constructor(private http: HttpClient) {}

  getAll(): Observable<Style[]> {
    return this.http.get<Style[]>(this.apiUrl);
  }

  // Stocke les styles en cache dès qu'on les charge
  setCache(styles: Style[]): void {
    this.stylesCache = styles;
  }

  getGradientStyle(styleName: string): { [key: string]: string } {
    const found = this.stylesCache.find(
      s => s.name.toLowerCase() === styleName.toLowerCase()
    );
    if (found) {
      return { background: `linear-gradient(135deg, ${found.color1}, ${found.color2})` };
    }
    return { background: 'linear-gradient(135deg, #3d2d1e, #1a1410)' };
  }
}
