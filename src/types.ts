export type UserRole = 'user' | 'uploader' | 'support' | 'superadmin';
export type UserStatus = 'standard' | 'premium';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  birthYear?: number;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
}

export interface Anime {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  genre: string[];
  rating: number;
  episodes: number;
  status: 'Ongoing' | 'Completed';
  year: number;
  accessType: 'public' | 'premium';
  upgradeLink?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type AppSection = 'home' | 'ai' | 'profile' | 'favorites';
