export type UserRole = 'user' | 'uploader' | 'support' | 'superadmin';

export interface Tariff {
  id: string;
  name: string;
  description: string;
  buttonLabel: string;
  redirectUrl: string;
  price?: string;
  hideAds?: boolean;
  hiddenAdLocations?: string[];
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  birthYear?: number;
  role: UserRole;
  status: string; // Changed from 'standard' | 'premium' to string for dynamic tariffs
  tariffId?: string; // Link to the specific tariff
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
  accessType: 'public' | string[]; // Can be 'public' or an array of tariff IDs
  contentType: 'full' | 'trailer' | 'edit';
  telegramFileId?: string; // Telegram File ID for the video
  relatedAnimeId?: string; // ID of the related anime (e.g., next episode or full version for edits)
  views: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AdConfig {
  id: string;
  location: 'top' | 'sidebar' | 'bottom' | 'popup';
  content: string; // HTML or script for the ad
  isEnabled: boolean;
  updatedAt: number;
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'gemini' | 'openai' | 'other';
  apiKey: string;
  modelName: string;
  isEnabled: boolean;
  isDefault: boolean;
  updatedAt: number;
}

export type Language = 'uz' | 'ru' | 'en';

export type AppSection = 'home' | 'ai' | 'profile' | 'favorites';

export interface Playlist {
  id: string;
  uid: string;
  name: string;
  description: string;
  animeIds: string[];
  createdAt: number;
  updatedAt: number;
}
