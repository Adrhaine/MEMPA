export interface Song {
  id? : string;
  title: string;
  artist: string;
  duration? : string;
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
  likes?: string[];
  coverImage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Style {
  _id: string;
  name: string;
  color1: string;
  color2: string;
}
