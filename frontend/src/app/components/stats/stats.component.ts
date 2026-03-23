import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StatsService, Stats } from '../../services/stats.service';
import { AuthService } from '../../services/auth.service';
import { Chart, registerables } from 'chart.js';

// Enregistre tous les modules Chart.js nécessaires
Chart.register(...registerables);

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent implements OnInit, AfterViewInit {

  // Références aux canvas des graphiques
  @ViewChild('styleChart') styleChartRef!: ElementRef;
  @ViewChild('topPlaylistsChart') topPlaylistsChartRef!: ElementRef;
  @ViewChild('songsChart') songsChartRef!: ElementRef;
  @ViewChild('timelineChart') timelineChartRef!: ElementRef;
  @ViewChild('styleCompareChart') styleCompareChartRef!: ElementRef;

  stats: Stats | null = null;
  isLoading: boolean = true;

  private charts: Chart[] = [];

  constructor(
    private statsService: StatsService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.statsService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit(): void {
    // On attend que les données soient chargées avant de créer les graphiques
    const interval = setInterval(() => {
      if (this.stats) {
        clearInterval(interval);
        this.createCharts();
      }
    }, 100);
  }

  private createCharts(): void {
    this.createStylePieChart();
    this.createTopPlaylistsChart();
    this.createSongsChart();
    this.createTimelineChart();
    this.createStyleCompareChart();
  }

  // Camembert — répartition des styles
  private createStylePieChart(): void {
    const ctx = this.styleChartRef.nativeElement.getContext('2d');
    this.charts.push(new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.stats!.styleStats.map(s => s._id),
        datasets: [{
          data: this.stats!.styleStats.map(s => s.count),
          backgroundColor: [
            '#e8c46c', '#a78bfa', '#f87171', '#34d399',
            '#60a5fa', '#fb923c', '#e879f9', '#94a3b8'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#f5e6d3', font: { size: 12 } }
          }
        }
      }
    }));
  }

  // Barres horizontales — top 5 playlists les plus vues
  private createTopPlaylistsChart(): void {
    const ctx = this.topPlaylistsChartRef.nativeElement.getContext('2d');
    this.charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.stats!.topPlaylists.map(p => p.name),
        datasets: [{
          label: 'Vues',
          data: this.stats!.topPlaylists.map(p => p.clicks),
          backgroundColor: '#e8c46c',
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#a89078' }, grid: { color: '#3d2d1e' } },
          y: { ticks: { color: '#f5e6d3' }, grid: { display: false } }
        }
      }
    }));
  }

  // Barres verticales — morceaux par playlist
  private createSongsChart(): void {
    const ctx = this.songsChartRef.nativeElement.getContext('2d');
    this.charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.stats!.songsByPlaylist.map(p => p.name),
        datasets: [{
          label: 'Morceaux',
          data: this.stats!.songsByPlaylist.map(p => p.songCount),
          backgroundColor: '#a78bfa',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#f5e6d3' }, grid: { display: false } },
          y: { ticks: { color: '#a89078' }, grid: { color: '#3d2d1e' } }
        }
      }
    }));
  }

  // Courbe — évolution des créations dans le temps
  private createTimelineChart(): void {
    const ctx = this.timelineChartRef.nativeElement.getContext('2d');
    this.charts.push(new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.stats!.creationsOverTime.map(c => c._id),
        datasets: [{
          label: 'Playlists créées',
          data: this.stats!.creationsOverTime.map(c => c.count),
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#34d399'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#a89078' }, grid: { color: '#3d2d1e' } },
          y: {
            ticks: { color: '#a89078', stepSize: 1 },
            grid: { color: '#3d2d1e' },
            beginAtZero: true
          }
        }
      }
    }));
  }

  // Barres groupées — style créé vs consulté
  private createStyleCompareChart(): void {
    const ctx = this.styleCompareChartRef.nativeElement.getContext('2d');
    this.charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.stats!.styleStats.map(s => s._id),
        datasets: [
          {
            label: 'Playlists créées',
            data: this.stats!.styleStats.map(s => s.count),
            backgroundColor: '#e8c46c',
            borderRadius: 4
          },
          {
            label: 'Total vues',
            data: this.stats!.styleStats.map(s => s.totalViews),
            backgroundColor: '#60a5fa',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: '#f5e6d3', font: { size: 12 } }
          }
        },
        scales: {
          x: { ticks: { color: '#f5e6d3' }, grid: { display: false } },
          y: { ticks: { color: '#a89078' }, grid: { color: '#3d2d1e' } }
        }
      }
    }));
  }

  isLoggedIn(): boolean { return this.authService.isLoggedIn(); }
  getUsername(): string { return this.authService.getCurrentUser()?.username || ''; }
  goBack(): void { this.router.navigate(['/']); }

  // Nettoyage des graphiques quand on quitte la page
  ngOnDestroy(): void {
    this.charts.forEach(chart => chart.destroy());
  }
}
