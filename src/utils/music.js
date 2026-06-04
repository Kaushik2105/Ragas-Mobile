import { API_BASE_URL } from '../api/axios';

const staticBaseUrl = API_BASE_URL.replace('/api', '');

export const unwrap = (response) => response.data?.data ?? response.data;

export const assetUrl = (path) => {
  if (!path) return '';
  return path.startsWith('http') ? path : `${staticBaseUrl}${path}`;
};

export const formatDuration = (seconds = 0) => {
  const safeSeconds = Number.isFinite(Number(seconds)) ? Number(seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

export const initials = (name = 'MS') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'MS';

export const getSongsFromPayload = (payload) => payload?.songs ?? payload ?? [];

export const getFavoritesSongs = (favorites = []) =>
  favorites.map((favorite) => favorite.song).filter(Boolean);
