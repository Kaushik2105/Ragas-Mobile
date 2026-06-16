import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { assetUrl } from './music';

const DOWNLOAD_DIR = `${FileSystem.documentDirectory}offline-songs/`;
const CACHE_DIR = `${FileSystem.cacheDirectory}offline-playback/`;
const KEY_STORAGE = 'ragas:offline-song-key';
const DOWNLOADS_STORAGE = 'ragas:downloaded-songs';
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const ensureDir = async (dir) => {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

const songFileName = (songId) => String(songId).replace(/[^a-zA-Z0-9_-]/g, '_');
const encryptedPath = (songId) => `${DOWNLOAD_DIR}${songFileName(songId)}.enc`;
const cachePath = (songId) => `${CACHE_DIR}${songFileName(songId)}.mp3`;

const createLocalKey = () => {
  const bytes = new Array(48);

  if (globalThis.crypto?.getRandomValues) {
    const randomBytes = new Uint8Array(bytes.length);
    globalThis.crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, (byte) => BASE64_ALPHABET[byte % BASE64_ALPHABET.length]).join('');
  }

  let seed = `${Date.now()}-${Math.random()}-${Math.random()}`;
  for (let index = 0; index < bytes.length; index += 1) {
    const code = seed.charCodeAt(index % seed.length);
    const mixed = Math.floor(Math.random() * 256) ^ code ^ ((index * 31) % 256);
    bytes[index] = BASE64_ALPHABET[mixed % BASE64_ALPHABET.length];
    seed = `${seed}${mixed}`;
  }

  return bytes.join('');
};

const maskBase64 = (value, key, direction = 1) => {
  const keyCodes = key.split('').map((char) => char.charCodeAt(0));
  const chars = new Array(value.length);

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const charIndex = BASE64_ALPHABET.indexOf(char);

    if (charIndex === -1) {
      chars[index] = char;
      continue;
    }

    const shift = keyCodes[index % keyCodes.length] % BASE64_ALPHABET.length;
    const nextIndex =
      direction > 0
        ? (charIndex + shift) % BASE64_ALPHABET.length
        : (charIndex - shift + BASE64_ALPHABET.length) % BASE64_ALPHABET.length;

    chars[index] = BASE64_ALPHABET[nextIndex];
  }

  return chars.join('');
};

const getEncryptionKey = async () => {
  const existing = await AsyncStorage.getItem(KEY_STORAGE);
  if (existing) return existing;

  const nextKey = createLocalKey();
  await AsyncStorage.setItem(KEY_STORAGE, nextKey);
  return nextKey;
};

const normalizeSong = (song) => ({
  id: song.id,
  title: song.title,
  artist: song.artist,
  genre: song.genre,
  duration: song.duration,
  coverImage: song.coverImage,
  audioUrl: song.audioUrl,
  downloadedAt: new Date().toISOString(),
});

const readDownloadedSongs = async () => {
  const raw = await AsyncStorage.getItem(DOWNLOADS_STORAGE);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDownloadedSongs = async (songs) => {
  await AsyncStorage.setItem(DOWNLOADS_STORAGE, JSON.stringify(songs));
};

export const isSongDownloaded = async (songId) => {
  const info = await FileSystem.getInfoAsync(encryptedPath(songId));
  return info.exists;
};

export const downloadEncryptedSong = async (song) => {
  if (!song?.id || !song?.audioUrl) return false;

  await ensureDir(DOWNLOAD_DIR);
  await ensureDir(CACHE_DIR);

  const key = await getEncryptionKey();
  const tempUri = `${CACHE_DIR}${songFileName(song.id)}.download`;
  try {
    const download = await FileSystem.downloadAsync(assetUrl(song.audioUrl), tempUri);

    if (download.status < 200 || download.status >= 300) {
      throw new Error(`Download returned status ${download.status}`);
    }

    const base64Audio = await FileSystem.readAsStringAsync(tempUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const encrypted = maskBase64(base64Audio, key, 1);

    await FileSystem.writeAsStringAsync(encryptedPath(song.id), encrypted);
    await FileSystem.deleteAsync(cachePath(song.id), { idempotent: true });
    const songs = await readDownloadedSongs();
    await writeDownloadedSongs([
      normalizeSong(song),
      ...songs.filter((item) => item.id !== song.id),
    ]);

    return true;
  } finally {
    await FileSystem.deleteAsync(tempUri, { idempotent: true });
  }
};

export const removeDownloadedSong = async (songId) => {
  await FileSystem.deleteAsync(encryptedPath(songId), { idempotent: true });
  await FileSystem.deleteAsync(cachePath(songId), { idempotent: true });
  const songs = await readDownloadedSongs();
  await writeDownloadedSongs(songs.filter((song) => song.id !== songId));
};

export const getDownloadedSongs = async () => {
  const songs = await readDownloadedSongs();
  const available = [];

  for (const song of songs) {
    if (await isSongDownloaded(song.id)) {
      available.push(song);
    }
  }

  if (available.length !== songs.length) {
    await writeDownloadedSongs(available);
  }

  return available;
};

export const getLocalPlaybackUri = async (songId) => {
  if (!(await isSongDownloaded(songId))) return null;

  await ensureDir(CACHE_DIR);
  const key = await getEncryptionKey();
  const encrypted = await FileSystem.readAsStringAsync(encryptedPath(songId));
  const decrypted = maskBase64(encrypted, key, -1);

  if (!decrypted) return null;

  const localUri = cachePath(songId);
  await FileSystem.writeAsStringAsync(localUri, decrypted, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return localUri;
};
