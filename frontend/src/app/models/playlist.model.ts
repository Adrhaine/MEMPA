export interface Song {
  title: string;
  artist: string;
}

export interface Playlist {
  _id?: string;
  name: string;
  creator: string;
  clicks: number;
  songs: Song[];
  contributors: string[];
  style: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
