import { Component, OnInit, OnDestroy, ElementRef } from '@angular/core';

@Component({
  selector: 'app-particles',
  standalone: true,
  templateUrl: './particles.component.html',
  styleUrl: './particles.component.css',
})
export class ParticlesComponent implements OnInit, OnDestroy {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private particles: any[] = [];
  private animationId!: number;
  private symbols = ['♪', '♫', '♩', '♬'];

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.canvas = this.el.nativeElement.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    this.createParticles();
    this.animate();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  private createParticles(): void {
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        symbol: this.symbols[Math.floor(Math.random() * this.symbols.length)],
        size: Math.random() * 10 + 8,
        opacity: Math.random() * 0.15 + 0.05,
        speed: Math.random() * 0.4 + 0.2,
        drift: (Math.random() - 0.5) * 0.1
      });
    }
  }

  private animate(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = '#e8c46c';
      this.ctx.font = `${p.size}px serif`;
      this.ctx.fillText(p.symbol, p.x, p.y);
      this.ctx.restore();
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -20) {
        p.y = window.innerHeight + 20;
        p.x = Math.random() * window.innerWidth;
      }
    }
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationId);
  }
}
