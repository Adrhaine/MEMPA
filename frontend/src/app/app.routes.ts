import { Routes } from '@angular/router';
import { PlaylistListComponent } from './components/playlist-list/playlist-list.component';
import { PlaylistDetailComponent } from './components/playlist-detail/playlist-detail.component';
import { CreatePlaylistComponent } from './components/create-playlist/create-playlist.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { authGuard } from './guards/auth-guard';
import {ProfileComponent} from './components/profile/profile.component';

export const routes: Routes = [
  { path: '', component: PlaylistListComponent },
  { path: 'playlist/:id', component: PlaylistDetailComponent },
  { path: 'create', component: CreatePlaylistComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '**', redirectTo: '' }
];
