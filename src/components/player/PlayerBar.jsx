import { Feather } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import { assetUrl, formatDuration } from '../../utils/music';
import usePlayerStore from '../../store/playerStore';
 
const PlayerBar = () => {
  const [seekWidth, setSeekWidth] = useState(1);
  const [isDraggingSeeking, setIsDraggingSeeking] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [queueOpen, setQueueOpen] = useState(false);
  const dragTimeRef = useRef(0);
  const {
    currentSong,
    queue,
    isPlaying,
    isLoading,
    duration,
    currentTime,
    isShuffled,
    repeatMode,
    togglePlay,
    playNext,
    playPrev,
    seek,
    toggleShuffle,
    toggleRepeat,
    cleanup,
    removeFromQueue,
    clearQueue,
  } = usePlayerStore();

  const getSeekTime = (x) => {
    if (!duration || !seekWidth) return 0;
    return Math.max(0, Math.min((x / seekWidth) * duration, duration));
  };

  const previewSeek = (x) => {
    const nextTime = getSeekTime(x);
    dragTimeRef.current = nextTime;
    setDragTime(nextTime);
  };

  const seekPanResponder = useMemo(() => PanResponder.create({
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
  }), [duration, seekWidth, seek]);

  if (!currentSong) {
    return (
      <View style={styles.idle}>
        <View style={styles.orb} />
        <Text style={styles.idleText}>Pick a track and let RAGAS breathe.</Text>
      </View>
    );
  }

  const displayedTime = isDraggingSeeking ? dragTime : currentTime;
  const progress = duration ? Math.min(displayedTime / duration, 1) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.nowPlaying}>
        {currentSong.coverImage ? (
          <Image source={{ uri: assetUrl(currentSong.coverImage) }} style={styles.cover} />
        ) : (
          <View style={styles.coverFallback}>
            <Text style={styles.coverLetter}>{currentSong.title?.[0] || 'M'}</Text>
          </View>
        )}
        <View style={styles.songText}>
          <Text numberOfLines={1} style={styles.title}>{currentSong.title}</Text>
          <Text numberOfLines={1} style={styles.artist}>{currentSong.artist}</Text>
        </View>
        <Pressable onPress={() => setQueueOpen(true)} style={[styles.smallButton, queue.length && styles.queueActive]}>
          <Feather name="list" size={17} color={queue.length ? colors.pink : colors.muted} />
        </Pressable>
        <Pressable onPress={cleanup} style={styles.smallButton}>
          <Feather name="x" size={17} color={colors.muted} />
        </Pressable>
      </View>
      <View style={styles.transport}>
        <Pressable onPress={toggleShuffle} style={[styles.iconButton, isShuffled && styles.active]}>
          <Feather name="shuffle" size={16} color={isShuffled ? colors.pink : colors.text} />
        </Pressable>
        <Pressable onPress={playPrev} style={styles.iconButton}>
          <Feather name="skip-back" size={19} color={colors.text} />
        </Pressable>
        <Pressable onPress={togglePlay} disabled={isLoading} style={styles.playButton}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.dark} />
          ) : (
            <Feather name={isPlaying ? 'pause' : 'play'} size={21} color={colors.dark} />
          )}
        </Pressable>
        <Pressable onPress={playNext} style={styles.iconButton}>
          <Feather name="skip-forward" size={19} color={colors.text} />
        </Pressable>
        <Pressable onPress={toggleRepeat} style={[styles.iconButton, repeatMode !== 'none' && styles.active]}>
          {repeatMode === 'one' ? (
            <View style={{ position: 'relative' }}>
              <Feather name="repeat" size={16} color={repeatMode !== 'none' ? colors.pink : colors.text} />
              <Text style={{
                position: 'absolute',
                top: -4,
                right: -4,
                fontSize: 10,
                fontWeight: 'bold',
                color: colors.pink,
              }}>1</Text>
            </View>
          ) : (
            <Feather name="repeat" size={16} color={repeatMode !== 'none' ? colors.pink : colors.text} />
          )}
        </Pressable>
      </View>
      <View
        style={styles.seekTrackContainer}
        onLayout={(event) => setSeekWidth(event.nativeEvent.layout.width || 1)}
        {...seekPanResponder.panHandlers}
      >
        <Pressable
          style={styles.seekTrack}
          onPress={async (event) => {
            const x = event.nativeEvent.locationX || 0;
            await seek(getSeekTime(x));
          }}
        >
          <View style={[styles.seekFill, { width: `${progress * 100}%` }]} />
        </Pressable>
        <View
          style={[
            styles.seekThumb,
            {
              left: `${progress * 100}%`,
            },
          ]}
        />
      </View>
      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatDuration(displayedTime)}</Text>
        <Text style={styles.time}>{formatDuration(duration)}</Text>
      </View>
      <Modal transparent visible={queueOpen} animationType="fade" onRequestClose={() => setQueueOpen(false)}>
        <Pressable style={styles.queueBackdrop} onPress={() => setQueueOpen(false)}>
          <Pressable style={styles.queuePanel}>
            <View style={styles.queueHeading}>
              <Text style={styles.queueTitle}>Queue</Text>
              {queue.length ? (
                <Pressable onPress={clearQueue} style={styles.clearButton}>
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
            {queue.length ? (
              <ScrollView style={styles.queueList}>
                {queue.map((song, index) => (
                  <View key={`${song.id}-${index}`} style={styles.queueItem}>
                    <Text style={styles.queueIndex}>{index + 1}</Text>
                    <View style={styles.queueMeta}>
                      <Text numberOfLines={1} style={styles.queueSongTitle}>{song.title}</Text>
                      <Text numberOfLines={1} style={styles.queueArtist}>{song.artist}</Text>
                    </View>
                    <Pressable onPress={() => removeFromQueue(index)} style={styles.removeQueueButton}>
                      <Feather name="trash-2" size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyQueue}>No queued songs yet.</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const shell = {
  backgroundColor: colors.panel,
  borderColor: colors.border,
  borderRadius: 24,
  borderWidth: 1,
  bottom: 84,
  left: 14,
  position: 'absolute',
  right: 14,
  zIndex: 20,
};

const styles = StyleSheet.create({
  idle: {
    ...shell,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 16,
  },
  idleText: {
    color: colors.muted,
    fontFamily: font.semi,
  },
  orb: {
    backgroundColor: colors.cyan,
    borderRadius: 8,
    height: 15,
    width: 15,
  },
  wrap: {
    ...shell,
    gap: 10,
    padding: 12,
  },
  nowPlaying: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  cover: {
    borderRadius: 16,
    height: 56,
    width: 56,
  },
  coverFallback: {
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.35)',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  coverLetter: {
    color: colors.text,
    fontFamily: font.black,
    fontSize: 20,
  },
  songText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontFamily: font.extra,
    fontSize: 15,
  },
  artist: {
    color: colors.muted,
    fontFamily: font.regular,
    marginTop: 3,
  },
  smallButton: {
    padding: 8,
  },
  queueActive: {
    borderColor: 'rgba(251, 113, 133, 0.42)',
  },
  transport: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  active: {
    borderColor: 'rgba(251, 113, 133, 0.42)',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 23,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  seekTrackContainer: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  seekTrack: {
    backgroundColor: 'rgba(148, 163, 184, 0.22)',
    borderRadius: 999,
    height: 5,
    overflow: 'hidden',
    width: '100%',
  },
  seekFill: {
    backgroundColor: colors.accent,
    height: '100%',
  },
  seekThumb: {
    backgroundColor: colors.cyan,
    borderRadius: 8,
    height: 16,
    position: 'absolute',
    width: 16,
    marginLeft: -8,
    top: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
  },
  queueBackdrop: {
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },
  queuePanel: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    maxHeight: '70%',
    padding: 14,
  },
  queueHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  queueTitle: {
    color: colors.text,
    fontFamily: font.extra,
    fontSize: 18,
  },
  clearButton: {
    padding: 8,
  },
  clearText: {
    color: colors.cyan,
    fontFamily: font.bold,
  },
  queueList: {
    maxHeight: 360,
  },
  queueItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    padding: 10,
  },
  queueIndex: {
    color: colors.muted,
    fontFamily: font.bold,
    width: 22,
  },
  queueMeta: {
    flex: 1,
  },
  queueSongTitle: {
    color: colors.text,
    fontFamily: font.semi,
  },
  queueArtist: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
    marginTop: 2,
  },
  removeQueueButton: {
    padding: 8,
  },
  emptyQueue: {
    color: colors.muted,
    fontFamily: font.regular,
    paddingVertical: 18,
    textAlign: 'center',
  },
});

export default PlayerBar;
