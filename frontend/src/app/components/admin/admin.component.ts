import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, AdminUser, AdminPlaylist, AdminStats } from '../../services/admin.service';
import { StyleService } from '../../services/style.service';
import { Style } from '../../services/style.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

type AdminTab = 'stats' | 'users' | 'styles' | 'playlists';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {

  activeTab: string = 'stats';
  isLoading: boolean = false;

  // Modale de confirmation
  showConfirmModal: boolean = false;
  confirmMessage: string = '';
  pendingAction: (() => void) | null = null;

  stats: AdminStats | null = null;
  users: AdminUser[] = [];
  playlists: AdminPlaylist[] = [];
  styles: Style[] = [];

  currentPage: number = 1;
  totalPages: number = 1;
  totalPlaylists: number = 0;

  userSearch: string = '';
  playlistSearch: string = '';

  newStyleName: string = '';
  newStyleColor1: string = '#3d2d1e';
  newStyleColor2: string = '#1a1410';
  showAddStyleForm: boolean = false;

  constructor(
    private adminService: AdminService,
    private styleService: StyleService,
    private authService: AuthService,
    private notificationService: NotificationService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    // Lazy loading : on ne charge les données qu'au premier accès à l'onglet
    switch (tab) {
      case 'stats': if (!this.stats) this.loadStats(); break;
      case 'users': if (this.users.length === 0) this.loadUsers(); break;
      case 'styles': if (this.styles.length === 0) this.loadStyles(); break;
      case 'playlists': if (this.playlists.length === 0) this.loadPlaylists(); break;
    }
  }

  loadStats(): void {
    this.isLoading = true;
    this.adminService.getStats().subscribe({
      next: (data) => { this.stats = data; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.notificationService.error('Impossible de charger les statistiques'); this.cdr.detectChanges(); }
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getUsers().subscribe({
      next: (users) => { this.users = users; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.notificationService.error('Impossible de charger les utilisateurs'); this.cdr.detectChanges(); }
    });
  }

  loadStyles(): void {
    this.isLoading = true;
    this.styleService.getAll().subscribe({
      next: (styles) => { this.styles = styles; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.notificationService.error('Impossible de charger les styles'); this.cdr.detectChanges(); }
    });
  }

  loadPlaylists(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;
    this.adminService.getPlaylists(page, this.playlistSearch).subscribe({
      next: (data) => {
        this.playlists = data.playlists;
        this.totalPages = data.totalPages;
        this.totalPlaylists = data.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.isLoading = false; this.notificationService.error('Impossible de charger les playlists'); this.cdr.detectChanges(); }
    });
  }


  get filteredUsers(): AdminUser[] {
    if (!this.userSearch.trim()) return this.users;
    const s = this.userSearch.toLowerCase();
    return this.users.filter(u =>
      u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    );
  }

  onPlaylistSearch(): void {
    this.loadPlaylists(1);
  }

  confirmDeleteUser(user: AdminUser): void {
    this.askConfirmation(
      `Supprimer l'utilisateur "${user.username}" ? Cette action est irréversible.`,
      () => this.deleteUser(user._id)
    );
  }

  deleteUser(id: string): void {
    this.adminService.deleteUser(id).subscribe({
      next: (res) => {
        this.users = this.users.filter(u => u._id !== id);
        this.notificationService.success(res.message);
        this.cdr.detectChanges();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Erreur lors de la suppression')
    });
  }

  toggleUserRole(user: AdminUser): void {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const label   = newRole === 'admin' ? 'promouvoir admin' : 'rétrograder en user';
    this.askConfirmation(
      `Voulez-vous ${label} "${user.username}" ?`,
      () => this.updateUserRole(user._id, newRole)
    );
  }

  updateUserRole(id: string, role: 'user' | 'admin'): void {
    this.adminService.updateUserRole(id, role).subscribe({
      next: (res) => {
        const user = this.users.find(u => u._id === id);
        if (user) user.role = res.user.role;
        this.notificationService.success(res.message);
        this.cdr.detectChanges();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Erreur lors de la mise à jour')
    });
  }

  confirmDeletePlaylist(playlist: AdminPlaylist): void {
    this.askConfirmation(
      `Supprimer la playlist "${playlist.name}" ? Cette action est irréversible.`,
      () => this.deletePlaylist(playlist._id)
    );
  }

  deletePlaylist(id: string): void {
    this.adminService.deletePlaylist(id).subscribe({
      next: (res) => {
        this.playlists = this.playlists.filter(p => p._id !== id);
        this.totalPlaylists--;
        this.notificationService.success(res.message);
        this.cdr.detectChanges();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Erreur lors de la suppression')
    });
  }

  submitAddStyle(): void {
    if (!this.newStyleName.trim()) {
      this.notificationService.error('Le nom du style est obligatoire');
      return;
    }
    this.adminService.addStyle(this.newStyleName.trim(), this.newStyleColor1, this.newStyleColor2).subscribe({
      next: (style) => {
        this.styles.push(style);
        this.newStyleName   = '';
        this.newStyleColor1 = '#3d2d1e';
        this.newStyleColor2 = '#1a1410';
        this.showAddStyleForm = false;
        this.notificationService.success(`Style "${style.name}" ajouté avec succès`);
        this.cdr.detectChanges();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Erreur lors de l\'ajout')
    });
  }

  confirmDeleteStyle(style: Style): void {
    this.askConfirmation(
      `Supprimer le style "${style.name}" ?`,
      () => this.deleteStyle(style._id)
    );
  }

  deleteStyle(id: string): void {
    this.adminService.deleteStyle(id).subscribe({
      next: (res) => {
        this.styles = this.styles.filter(s => s._id !== id);
        this.notificationService.success(res.message);
        this.cdr.detectChanges();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Erreur lors de la suppression')
    });
  }

  askConfirmation(message: string, action: () => void): void {
    this.confirmMessage = message;
    this.pendingAction  = action;
    this.showConfirmModal = true;
  }

  confirmAction(): void {
    if (this.pendingAction) this.pendingAction();
    this.closeModal();
  }

  closeModal(): void {
    this.showConfirmModal = false;
    this.pendingAction    = null;
    this.confirmMessage   = '';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  getGradient(s: Style): string {
    return `linear-gradient(135deg, ${s.color1}, ${s.color2})`;
  }

  getCurrentUserId(): string { return this.authService.getCurrentUser()?.id || ''; }
  getUsername(): string      { return this.authService.getCurrentUser()?.username || ''; }
  goHome(): void             { this.router.navigate(['/']); }
  onLogout(): void           { this.authService.logout(); this.router.navigate(['/login']); }
}
