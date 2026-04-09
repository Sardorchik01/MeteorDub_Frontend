import { Anime } from './types';

export const MOCK_ANIMES: Anime[] = [
  {
    id: '1',
    title: 'Demon Slayer: Kimetsu no Yaiba',
    description: 'A youth who survived a demon attack becomes a demon slayer to save his sister.',
    thumbnail: 'https://picsum.photos/seed/demonslayer/800/1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    genre: ['Action', 'Fantasy', 'Adventure'],
    rating: 8.9,
    episodes: 26,
    status: 'Completed',
    year: 2019,
    accessType: 'public'
  },
  {
    id: '2',
    title: 'Jujutsu Kaisen',
    description: 'A boy swallows a cursed talisman and enters a world of sorcerers.',
    thumbnail: 'https://picsum.photos/seed/jujutsu/800/1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    genre: ['Action', 'Supernatural'],
    rating: 8.7,
    episodes: 24,
    status: 'Completed',
    year: 2020,
    accessType: 'premium',
    upgradeLink: 'https://meteordub.uz/upgrade'
  },
  {
    id: '3',
    title: 'Chainsaw Man',
    description: 'Denji is a teenage boy living with a Chainsaw Demon named Pochita.',
    thumbnail: 'https://picsum.photos/seed/chainsaw/800/1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    genre: ['Action', 'Horror'],
    rating: 8.5,
    episodes: 12,
    status: 'Completed',
    year: 2022,
    accessType: 'public'
  },
  {
    id: '4',
    title: 'Attack on Titan',
    description: 'Humans fight for survival against giant man-eating humanoids.',
    thumbnail: 'https://picsum.photos/seed/titan/800/1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    genre: ['Action', 'Drama', 'Fantasy'],
    rating: 9.0,
    episodes: 75,
    status: 'Completed',
    year: 2013,
    accessType: 'premium',
    upgradeLink: 'https://meteordub.uz/upgrade'
  },
  {
    id: '5',
    title: 'Spy x Family',
    description: 'A spy, an assassin, and a telepath form a fake family for their own reasons.',
    thumbnail: 'https://picsum.photos/seed/spy/800/1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    genre: ['Comedy', 'Action'],
    rating: 8.6,
    episodes: 25,
    status: 'Completed',
    year: 2022,
    accessType: 'public'
  },
  {
    id: '6',
    title: 'One Piece',
    description: 'Monkey D. Luffy sets out to find the legendary treasure and become Pirate King.',
    thumbnail: 'https://picsum.photos/seed/onepiece/800/1200',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    genre: ['Action', 'Adventure', 'Comedy'],
    rating: 8.9,
    episodes: 1000,
    status: 'Ongoing',
    year: 1999,
    accessType: 'public'
  }
];
