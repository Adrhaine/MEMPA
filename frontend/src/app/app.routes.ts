import { Routes } from '@angular/router';
import { PlaylistListComponent } from './components/playlist-list/playlist-list';
import { PlaylistDetailComponent } from './components/playlist-detail/playlist-detail';
import { CreatePlaylistComponent } from './components/create-playlist/create-playlist';

export const routes: Routes = [
  { path: '', component: PlaylistListComponent },
  { path: 'playlist/:id', component: PlaylistDetailComponent },
  { path: 'create', component: CreatePlaylistComponent },
];
