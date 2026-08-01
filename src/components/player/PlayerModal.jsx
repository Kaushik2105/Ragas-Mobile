import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import usePlayerStore from '../../store/playerStore';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import { assetUrl, formatDuration, unwrap } from '../../utils/music';

const PlayerModal = ({ visible, onClose }) => {
  const {
    currentSong,
    isPlaying,
    isLoading,
    duration,
    currentTime,
    isShuffled,
    repeatMode,
    volume,
    togglePlay,
    playNext,
    playPrev,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();

  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [isDraggingSeeking, setIsDraggingSeeking] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [seekWidth, setSeekWidth] = useState(1);
  const [volWidth, setVolWidth] = useState(1);
  const [localVolume, setLocalVolume] = useState(volume);
  const dragTimeRef = useRef(0);

  // Sync local volume with store volume
  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  // Load favorites to check if the current song is favorited
  const loadFavorites = async () => {
    try {
      const response = await api.get('/favorites');
      const data = unwrap(response);
      const ids = new Set((data || []).map((item) => item.song?.id).filter(Boolean));
      setFavoriteIds(ids);
    } catch (e) {
      console.warn('Could not load favorites in player modal', e);
    }
  };

  useEffect(() => {
    if (visible && currentSong) {
      loadFavorites();
    }
  }, [visible, currentSong?.id]);

  const isFavorite = currentSong ? favoriteIds.has(currentSong.id) : false;

  const toggleFavorite = async () => {
    if (!currentSong) return;
    try {
      if (isFavorite) {
        await api.delete(`/favorites/${currentSong.id}`);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(currentSong.id);
          return next;
        });
        Toast.show({ type: 'success', text1: 'Removed from favorites' });
      } else {
        await api.post(`/favorites/${currentSong.id}`);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.add(currentSong.id);
          return next;
        });
        Toast.show({ type: 'success', text1: 'Added to favorites' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Favorite update failed' });
    }
  };

  // Seeker PanResponder Logic
  const getSeekTime = (x) => {
    if (!duration || !seekWidth) return 0;
    return Math.max(0, Math.min((x / seekWidth) * duration, duration));
  };

  const previewSeek = (x) => {
    const nextTime = getSeekTime(x);
    dragTimeRef.current = nextTime;
    setDragTime(nextTime);
  };

  const seekPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setIsDraggingSeeking(true);
          previewSeek(evt.nativeEvent.locationX || 0);
        },
        onPanResponderMove: (evt) => {
          previewSeek(evt.nativeEvent.locationX || 0);
        },
        onPanResponderRelease: async () => {
          setIsDraggingSeeking(false);
          await seek(dragTimeRef.current);
        },
        onPanResponderTerminate: async () => {
          setIsDraggingSeeking(false);
          await seek(dragTimeRef.current);
        },
      }),
    [duration, seekWidth, seek]
  );

  // Volume PanResponder Logic
  const getVolFromX = (x) => {
    if (!volWidth) return 0.8;
    return Math.max(0, Math.min(x / volWidth, 1));
  };

  const volumePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const vol = getVolFromX(evt.nativeEvent.locationX || 0);
          setLocalVolume(vol);
          setVolume(vol);
        },
        onPanResponderMove: (evt) => {
          const vol = getVolFromX(evt.nativeEvent.locationX || 0);
          setLocalVolume(vol);
          setVolume(vol);
        },
      }),
    [volWidth, setVolume]
  );

  // Cover Art Swipes
  let touchStartX = 0;
  const handleTouchStart = (e) => {
    touchStartX = e.nativeEvent.pageX;
  };
  const handleTouchEnd = (e) => {
    const touchEndX = e.nativeEvent.pageX;
    const dx = touchEndX - touchStartX;
    if (dx > 60) {
      // Swipe Right -> play previous
      playPrev();
    } else if (dx < -60) {
      // Swipe Left -> play next
      playNext();
    }
  };

  if (!currentSong) return null;

  const displayedTime = isDraggingSeeking ? dragTime : currentTime;
  const progress = duration ? Math.min(displayedTime / duration, 1) : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.modalBg}>
        {/* Soft Background glows */}
        <View style={[styles.glow, styles.purpleGlow]} />
        <View style={[styles.glow, styles.cyanGlow]} />

        {/* Top Control Bar */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.iconButton}>
            <Feather name="chevron-down" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Now Playing</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Cover Art Wrapper */}
        <View
          style={styles.coverFrame}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {currentSong.coverImage ? (
            <Image source={{ uri: assetUrl(currentSong.coverImage) }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverFallback}>
              <Feather name="music" size={80} color={colors.cyan} />
            </View>
          )}
        </View>

        {/* Song Info Bar */}
        <View style={styles.metaRow}>
          <View style={styles.songMeta}>
            <Text numberOfLines={1} style={styles.songTitle}>
              {currentSong.title}
            </Text>
            <Text numberOfLines={1} style={styles.songArtist}>
              {currentSong.artist}
            </Text>
          </View>
          <Pressable onPress={toggleFavorite} style={styles.favoriteBtn}>
            <Feather
              name="heart"
              size={24}
              color={isFavorite ? colors.pink : colors.muted}
              style={isFavorite && styles.favoriteActive}
            />
          </Pressable>
        </View>

        {/* Seeker / Progress bar */}
        <View style={styles.seekContainer}>
          <View
            style={styles.seekTrackContainer}
            onLayout={(event) => setSeekWidth(event.nativeEvent.layout.width || 1)}
            {...seekPanResponder.panHandlers}
          >
            <View style={styles.seekTrack}>
              <View style={[styles.seekFill, { width: `${progress * 100}%` }]} />
            </View>
            <View pointerEvents="none" style={[styles.seekThumb, { left: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatDuration(displayedTime)}</Text>
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>
        </View>

        {/* Primary Controls Row */}
        <View style={styles.controlsRow}>
          <Pressable onPress={toggleShuffle} style={[styles.optionBtn, isShuffled && styles.optionActive]}>
            <Feather name="shuffle" size={20} color={isShuffled ? colors.pink : colors.text} />
          </Pressable>

          <Pressable onPress={playPrev} style={styles.playControlBtn}>
            <Feather name="skip-back" size={26} color={colors.text} />
          </Pressable>

          <Pressable onPress={togglePlay} disabled={isLoading} style={styles.mainPlayBtn}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.dark} />
            ) : (
              <Feather name={isPlaying ? 'pause' : 'play'} size={28} color={colors.dark} style={!isPlaying && { marginLeft: 4 }} />
            )}
          </Pressable>

          <Pressable onPress={playNext} style={styles.playControlBtn}>
            <Feather name="skip-forward" size={26} color={colors.text} />
          </Pressable>

          <Pressable onPress={toggleRepeat} style={[styles.optionBtn, repeatMode !== 'none' && styles.optionActive]}>
            <Feather name="repeat" size={20} color={repeatMode !== 'none' ? colors.pink : colors.text} />
            {repeatMode === 'one' && <Text style={styles.repeatBadge}>1</Text>}
          </Pressable>
        </View>

        {/* Volume controls (Sound Bar) */}
        <View style={styles.volumeContainer}>
          <Feather name="volume-1" size={18} color={colors.muted} />
          <View
            style={styles.volumeTrackContainer}
            onLayout={(event) => setVolWidth(event.nativeEvent.layout.width || 150)}
            {...volumePanResponder.panHandlers}
          >
            <View style={styles.volumeTrack}>
              <View style={[styles.volumeFill, { width: `${localVolume * 100}%` }]} />
            </View>
            <View pointerEvents="none" style={[styles.volumeThumb, { left: `${localVolume * 100}%` }]} />
          </View>
          <Feather name="volume-2" size={18} color={colors.muted} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: colors.bg, // Soothing background color
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 48,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    zIndex: -1,
  },
  purpleGlow: {
    left: -80,
    top: 60,
    backgroundColor: colors.accent,
    opacity: 0.12,
  },
  cyanGlow: {
    right: -80,
    bottom: 120,
    backgroundColor: colors.cyan,
    opacity: 0.08,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  headerTitle: {
    color: colors.muted,
    fontFamily: font.bold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  iconButton: {
    padding: 8,
    marginLeft: -8,
  },
  coverFrame: {
    aspectRatio: 1,
    width: '100%',
    maxHeight: 330,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
    alignSelf: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverFallback: {
    flex: 1,
    backgroundColor: 'rgba(34, 211, 238, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(34, 211, 238, 0.1)',
    borderWidth: 1,
    borderRadius: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  songMeta: {
    flex: 1,
    gap: 4,
    paddingRight: 16,
  },
  songTitle: {
    color: colors.text,
    fontFamily: font.black,
    fontSize: 22,
  },
  songArtist: {
    color: colors.muted,
    fontFamily: font.semi,
    fontSize: 15,
  },
  favoriteBtn: {
    padding: 8,
    marginRight: -8,
  },
  favoriteActive: {
    fill: colors.pink,
  },
  seekContainer: {
    gap: 8,
  },
  seekTrackContainer: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  seekTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  seekFill: {
    height: '100%',
    backgroundColor: colors.cyan,
  },
  seekThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.white,
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  optionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  optionActive: {
    backgroundColor: 'rgba(251, 113, 133, 0.08)',
  },
  repeatBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 9,
    fontFamily: font.bold,
    color: colors.pink,
  },
  playControlBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    gap: 12,
  },
  volumeTrackContainer: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  volumeTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
  },
  volumeFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
  },
  volumeThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginLeft: -6,
  },
});

export default PlayerModal;
