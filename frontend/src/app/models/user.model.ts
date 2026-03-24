// Représente un utilisateur dans l'application
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

// Représente la réponse du serveur après un login réussi
export interface AuthResponse {
  token: string;
  user: User;
}
