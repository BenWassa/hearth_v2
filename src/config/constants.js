import {
  Coffee,
  Smile,
  Flame,
  Eye,
  Armchair,
  Feather,
  Battery,
  Zap,
} from 'lucide-react';
import { getAppBase } from '../utils/env.js';

export const VIBES = [
  { id: 'comfort', label: 'Comfort', icon: Coffee },
  { id: 'easy', label: 'Easy', icon: Smile },
  { id: 'gripping', label: 'Gripping', icon: Flame },
  { id: 'visual', label: 'Visual', icon: Eye },
  { id: 'classic', label: 'Classic', icon: Armchair },
];

export const ENERGIES = [
  { id: 'light', label: 'Light', icon: Feather, desc: 'Background friendly' },
  {
    id: 'balanced',
    label: 'Balanced',
    icon: Battery,
    desc: 'Engaging but chill',
  },
  { id: 'focused', label: 'Focused', icon: Zap, desc: 'Phones down' },
];

export const PRESET_SUGGESTIONS = [
  {
    title: 'Paddington 2',
    type: 'movie',
    vibe: 'comfort',
    energy: 'light',
    poster: '/posters/paddington-2.jpg',
  },
  {
    title: 'Severance',
    type: 'show',
    vibe: 'gripping',
    energy: 'focused',
    poster: '/posters/severance.jpg',
  },
  {
    title: 'The Grand Budapest Hotel',
    type: 'movie',
    vibe: 'visual',
    energy: 'balanced',
    poster: '/posters/the-grand-budapest-hotel.jpg',
  },
  {
    title: 'Abbott Elementary',
    type: 'show',
    vibe: 'easy',
    energy: 'light',
    poster: '/posters/abbott-elementary.jpg',
  },
  {
    title: 'Spirited Away',
    type: 'movie',
    vibe: 'visual',
    energy: 'balanced',
    poster: '/posters/spirited-away.jpg',
  },
  {
    title: 'The Bear',
    type: 'show',
    vibe: 'gripping',
    energy: 'focused',
    poster: '/posters/the-bear.jpg',
  },
  {
    title: 'Ted Lasso',
    type: 'show',
    vibe: 'comfort',
    energy: 'balanced',
    poster: '/posters/ted-lasso.jpg',
  },
];

export const SPACE_ID_STORAGE_KEY = 'hearth_space_id';
export const DAILY_TRAY_STORAGE_PREFIX = 'hearth_daily_tray';

export const APP_BASE = getAppBase();
export const POSTER_DIR = '/posters';
export const BACKDROP_DIR = '/backdrops';
