import { Audio } from 'expo-av';
import { PermissionsAndroid, Platform } from 'react-native';
import { create } from 'zustand';
import api from '../api/axios';
import {
  Command,
  PlaybackState,
  addMediaControlListener,
  disableMediaControls,
  enableMediaControls,
  updateMediaMetadata,
  updateMediaPlaybackState,
} from '../utils/mediaControls';
import { assetUrl } from '../utils/music';
import { getLocalPlaybackUri } from '../utils/offlineSongs';

const requestAndroidNotificationPermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;

  try {
    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    if (!permission) return true;

    const currentStatus = await PermissionsAndroid.check(permission);
    if (currentStatus) return true;

    const result = await PermissionsAndroid.request(permission);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};

const usePlayerStore = create((set, get) => {
  // Listen for hardware/notification controls from Android and iOS
  addMediaControlListener((event) => {
    switch (event.command) {
      case Command.PLAY:
      case Command.PAUSE:
        get().togglePlay();
        break;
      case Command.NEXT_TRACK:
        get().playNext();
        break;
      case Command.PREVIOUS_TRACK:
        get().playPrev();
        break;
      case Command.SEEK:
        if (event.data?.position !== undefined) {
          get().seek(event.data.position);
        }
        break;
      case Command.STOP:
        get().cleanup();
        break;
    }
  });

  return {
    currentSong: null,
    playlist: [],
    queue: [],
    shuffledPlaylist: [],
    currentIndex: -1,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 0.8,
    isMuted: false,
    isShuffled: false,
    repeatMode: 'none',
    sound: null,

    playSong: async (song, songList = []) => {
      const state = get();
      if (!song?.audioUrl) return;

      if (state.sound) {
        await state.sound.unloadAsync();
      }

      const list = songList.length > 0 ? songList : [song];
      const index = list.findIndex((item) => item.id === song.id);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      let playbackUri = assetUrl(song.audioUrl);
      try {
        playbackUri = (await getLocalPlaybackUri(song.id)) || playbackUri;
      } catch (error) {
        console.warn('Falling back to streaming playback:', error);
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: playbackUri },
        { shouldPlay: true, volume: state.isMuted ? 0 : state.volume },
        (status) => {
          if (!status.isLoaded) return;

          const nextDuration = (status.durationMillis || 0) / 1000;
          const nextTime = (status.positionMillis || 0) / 1000;
          const hasDurationChanged = get().duration !== nextDuration;

          set({
            isPlaying: status.isPlaying,
            duration: nextDuration,
            currentTime: nextTime,
          });

          // Sync metadata once duration resolves from the async stream loader
          if (hasDurationChanged && nextDuration > 0) {
            updateMediaMetadata({
              title: song.title,
              artist: song.artist,
              artwork: song.coverImage ? { uri: assetUrl(song.coverImage) } : undefined,
              duration: nextDuration,
              elapsedTime: nextTime,
            });
          }

          // Regularly sync playback position to native widget (no lag since rate 1 handles native interpolation)
          if (status.isPlaying) {
            updateMediaPlaybackState(
              PlaybackState.PLAYING,
              nextTime,
              1
            );
          }

          if (status.didJustFinish) {
            const latest = get();
            if (latest.repeatMode === 'one') {
              get().playSong(latest.currentSong, latest.playlist);
            } else {
              get().playNext();
            }
          }
        }
      );

      api.post(`/songs/${song.id}/play`).catch(() => {});
      set({
        currentSong: song,
        playlist: list,
        shuffledPlaylist: state.isShuffled ? state.shuffledPlaylist : [],
        currentIndex: index >= 0 ? index : 0,
        sound,
        currentTime: 0,
        isPlaying: true,
      });

      // Enable system controls and post the notification banner
      try {
        await requestAndroidNotificationPermission();
        await enableMediaControls({
          capabilities: [
            Command.PLAY,
            Command.PAUSE,
            Command.NEXT_TRACK,
            Command.PREVIOUS_TRACK,
            Command.SEEK,
          ],
          compactCapabilities: [
            Command.PREVIOUS_TRACK,
            Command.PLAY,
            Command.NEXT_TRACK,
          ],
          notification: {
            color: '#a855f7',
            showWhenClosed: true,
          },
        });
        await updateMediaMetadata({
          title: song.title,
          artist: song.artist,
          artwork: song.coverImage ? { uri: assetUrl(song.coverImage) } : undefined,
          duration: 0,
        });
        await updateMediaPlaybackState(PlaybackState.PLAYING, 0, 1);
      } catch (e) {
        console.warn('Failed to configure native media controls:', e);
      }
    },

    addToQueue: (song) => {
      if (!song?.audioUrl) return;
      set((state) => ({ queue: [...state.queue, song] }));
    },

    removeFromQueue: (index) =>
      set((state) => ({ queue: state.queue.filter((_, itemIndex) => itemIndex !== index) })),

    clearQueue: () => set({ queue: [] }),

    togglePlay: async () => {
      const { sound, isPlaying, currentTime } = get();
      if (!sound) return;
      if (isPlaying) {
        await sound.pauseAsync();
        await updateMediaPlaybackState(PlaybackState.PAUSED, currentTime, 0);
      } else {
        await sound.playAsync();
        await updateMediaPlaybackState(PlaybackState.PLAYING, currentTime, 1);
      }
    },

    playNext: () => {
      const state = get();
      if (state.queue.length > 0) {
        const [nextSong, ...rest] = state.queue;
        set({ queue: rest });
        get().playSong(nextSong, state.playlist.length ? state.playlist : [nextSong]);
        return;
      }

      const activeList =
        state.isShuffled && state.shuffledPlaylist.length > 0
          ? state.shuffledPlaylist
          : state.playlist;
      if (!activeList.length) return;

      let nextIndex = state.currentIndex + 1;
      if (nextIndex >= activeList.length) {
        if (state.repeatMode === 'all') {
          nextIndex = 0;
        } else {
          set({ isPlaying: false });
          updateMediaPlaybackState(PlaybackState.PAUSED, state.currentTime, 0);
          return;
        }
      }
      get().playSong(activeList[nextIndex], state.playlist);
    },

    playPrev: async () => {
      const state = get();
      const activeList =
        state.isShuffled && state.shuffledPlaylist.length > 0
          ? state.shuffledPlaylist
          : state.playlist;
      if (!activeList.length) return;

      if (state.currentTime > 3 && state.sound) {
        await state.sound.setPositionAsync(0);
        set({ currentTime: 0 });
        await updateMediaPlaybackState(
          state.isPlaying ? PlaybackState.PLAYING : PlaybackState.PAUSED,
          0,
          state.isPlaying ? 1 : 0
        );
        return;
      }

      let prevIndex = state.currentIndex - 1;
      if (prevIndex < 0) prevIndex = activeList.length - 1;
      get().playSong(activeList[prevIndex], state.playlist);
    },

    seek: async (time) => {
      const { sound, isPlaying } = get();
      if (sound) {
        await sound.setPositionAsync(time * 1000);
        set({ currentTime: time });
        await updateMediaPlaybackState(
          isPlaying ? PlaybackState.PLAYING : PlaybackState.PAUSED,
          time,
          isPlaying ? 1 : 0
        );
      }
    },

    setVolume: async (volume) => {
      const { sound } = get();
      if (sound) await sound.setVolumeAsync(volume);
      set({ volume, isMuted: volume === 0 });
    },

    toggleMute: async () => {
      const { sound, isMuted, volume } = get();
      if (sound) await sound.setVolumeAsync(isMuted ? volume || 0.8 : 0);
      set({ isMuted: !isMuted });
    },

    toggleShuffle: () =>
      set((state) => {
        const isShuffled = !state.isShuffled;
        let shuffledPlaylist = [];
        let currentIndex = state.currentIndex;

        if (isShuffled && state.playlist.length > 0) {
          shuffledPlaylist = [...state.playlist].sort(() => Math.random() - 0.5);
          if (state.currentSong) {
            const idx = shuffledPlaylist.findIndex((song) => song.id === state.currentSong.id);
            if (idx > 0) {
              shuffledPlaylist.splice(idx, 1);
              shuffledPlaylist.unshift(state.currentSong);
            }
          }
          currentIndex = state.currentSong ? 0 : -1;
        } else if (!isShuffled && state.currentSong) {
          currentIndex = state.playlist.findIndex((song) => song.id === state.currentSong.id);
        }

        return { isShuffled, shuffledPlaylist, currentIndex };
      }),

    toggleRepeat: async () => {
      const modes = ['none', 'all', 'one'];
      const { repeatMode, sound } = get();
      const nextIndex = (modes.indexOf(repeatMode) + 1) % modes.length;
      const nextMode = modes[nextIndex];
      // If we have an active sound, set its looping flag for reliable repeat-one behavior
      if (sound && typeof sound.setIsLoopingAsync === 'function') {
        try {
          await sound.setIsLoopingAsync(nextMode === 'one');
        } catch (e) {
          // ignore looping API errors
        }
      }
      set({ repeatMode: nextMode });
    },

    cleanup: async () => {
      const { sound } = get();
      if (sound) await sound.unloadAsync();
      try {
        await disableMediaControls();
      } catch (e) {
        // Ignore native media control errors during cleanup
      }
      set({
        currentSong: null,
        currentIndex: -1,
        sound: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      });
    },
  };
});

export default usePlayerStore;
