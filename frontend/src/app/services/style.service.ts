import { Injectable } from '@angular/core';

// Ce service est partagé entre tous les composants qui ont besoin
// de convertir un style musical en classe CSS de gradient
@Injectable({ providedIn: 'root' })
export class StyleService {

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
