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

export const formatPlayCount = (count = 0) => {
  const safeCount = Number.isFinite(Number(count)) ? Number(count) : 0;
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(safeCount);
};

const numericValue = (...values) => {
  const value = values.find((item) => item !== undefined && item !== null);
  return Number.isFinite(Number(value)) ? Number(value) : 0;
};

const valueByKey = (source = {}, keys = []) => {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }

  const normalizedKeys = keys.map((key) => key.toLowerCase().replace(/_/g, ''));
  const matchedKey = Object.keys(source).find((key) =>
    normalizedKeys.includes(key.toLowerCase().replace(/_/g, ''))
  );

  return matchedKey ? source[matchedKey] : undefined;
};

export const songPlayCount = (song = {}) =>
  numericValue(valueByKey(song, ['playCount', 'play_count', 'plays', 'play']));

export const playlistPlayCount = (playlist = {}) => {
  const directTotal = numericValue(
    valueByKey(playlist, [
      'totalPlayCount',
      'total_play_count',
      'totalplaycount',
      'totalPlays',
      'total_plays',
      'playCount',
      'play_count',
      'plays',
    ])
  );
  const songTotal = (playlist.songs || []).reduce((total, song) => total + songPlayCount(song), 0);

  return Math.max(directTotal, songTotal);
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
