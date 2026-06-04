import { Feather } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, Animated, Easing } from 'react-native';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import { assetUrl, formatDuration } from '../../utils/music';
import usePlayerStore from '../../store/playerStore';

const IconButton = ({ name, active, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.88,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.iconButton,
        active && styles.iconButtonActive,
        pressed && styles.iconButtonPressed,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Feather name={name} size={17} color={active ? colors.pink : colors.text} />
      </Animated.View>
    </Pressable>
  );
};

const EqualizerBar = ({ delay, duration, maxHeight = 24 }) => {
  const anim = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    let isMounted = true;
    const cycle = () => {
      if (!isMounted) return;
      Animated.sequence([
        Animated.timing(anim, {
          toValue: maxHeight,
          duration: duration,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 4,
          duration: duration * 0.8,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: false,
        }),
      ]).start(() => {
        if (isMounted) cycle();
      });
    };

    const timeout = setTimeout(cycle, delay);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
      anim.stopAnimation();
    };
  }, [anim, delay, duration, maxHeight]);

  return <Animated.View style={[styles.bar, { height: anim }]} />;
};

const Equalizer = ({ compact }) => (
  <View style={[styles.equalizer, { height: compact ? 18 : 26 }]}>
    <EqualizerBar delay={0} duration={450} maxHeight={compact ? 10 : 18} />
    <EqualizerBar delay={150} duration={400} maxHeight={compact ? 16 : 24} />
    <EqualizerBar delay={300} duration={500} maxHeight={compact ? 12 : 20} />
  </View>
);

const SongCard = ({ song, songs = [], isFavorite = false, onFavorite, onAddToPlaylist, onFeedback, compact = false }) => {
  const { currentSong, isPlaying, playSong } = usePlayerStore();
  const active = currentSong?.id === song.id;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;
  const activeGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    let anim;
    if (active && isPlaying) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(activeGlow, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(activeGlow, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      anim.start();
    } else {
      activeGlow.setValue(0);
    }
    return () => {
      if (anim) anim.stop();
    };
  }, [active, isPlaying, activeGlow]);

  const animatedBorderColor = active
    ? activeGlow.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(34, 211, 238, 0.35)', 'rgba(34, 211, 238, 0.95)'],
      })
    : colors.border;

  return (
    // Outer view: JS-driver border color animation (cannot use native driver for color)
    <Animated.View
      style={[
        styles.card,
        compact && styles.compactCard,
        { borderColor: animatedBorderColor },
      ]}
    >
      {/* Inner view: native-driver opacity + translate entrance animation */}
      <Animated.View
        style={[
          styles.innerCard,
          compact && styles.compactCard,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Pressable onPress={() => playSong(song, songs)} style={[styles.cover, compact && styles.compactCover]}>
          {song.coverImage ? (
            <Image source={{ uri: assetUrl(song.coverImage) }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverFallback}>
              <Text style={styles.coverLetter}>{song.title?.[0] || 'M'}</Text>
            </View>
          )}
          {active && isPlaying ? (
            <View style={[styles.playPill, compact && styles.compactPlayPill, styles.eqPill]}>
              <Equalizer compact={compact} />
            </View>
          ) : (
            <View style={[styles.playPill, compact && styles.compactPlayPill]}>
              <Feather name="play" size={compact ? 14 : 18} color={colors.dark} />
            </View>
          )}
        </Pressable>
        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.title}>
            {song.title}
          </Text>
          <Text numberOfLines={1} style={styles.artist}>
            {song.artist}
          </Text>
          <View style={styles.details}>
            <Text numberOfLines={1} style={styles.detailText}>
              {song.genre || 'Unknown genre'}
            </Text>
            <Text numberOfLines={1} style={[styles.detailText, styles.durationText]}>
              {formatDuration(song.duration)}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          {compact ? <View style={styles.actionSpacerCompact} /> : <View style={styles.actionSpacer} />}
          {onFeedback ? <IconButton name="star" onPress={() => onFeedback(song)} /> : null}
          {onAddToPlaylist ? <IconButton name="list" onPress={() => onAddToPlaylist(song)} /> : null}
          {onFavorite ? <IconButton name="heart" active={isFavorite} onPress={() => onFavorite(song)} /> : null}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    width: '100%',
  },
  innerCard: {
    gap: 12,
    padding: 12,
    flex: 1,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeCard: {
    borderColor: 'rgba(34, 211, 238, 0.62)',
  },
  cover: {
    aspectRatio: 1.1,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  compactCover: {
    height: 74,
    width: 74,
    aspectRatio: undefined,
  },
  coverImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  coverFallback: {
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.36)',
    flex: 1,
    justifyContent: 'center',
  },
  coverLetter: {
    color: colors.text,
    fontFamily: font.black,
    fontSize: 40,
  },
  playPill: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 22,
    bottom: 10,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    width: 42,
  },
  compactPlayPill: {
    bottom: 6,
    height: 30,
    right: 6,
    width: 30,
    borderRadius: 15,
  },
  eqPill: {
    backgroundColor: 'rgba(8, 7, 19, 0.82)',
    borderColor: colors.cyan,
    borderWidth: 1.5,
  },
  meta: {
    flex: 1,
    gap: 5,
  },
  title: {
    color: colors.text,
    fontFamily: font.extra,
    fontSize: 17,
  },
  artist: {
    color: colors.muted,
    fontFamily: font.regular,
  },
  details: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  detailText: {
    color: colors.muted,
    flexShrink: 1,
    fontFamily: font.regular,
    fontSize: 12,
  },
  durationText: {
    flexShrink: 0,
    minWidth: 40,
    textAlign: 'right',
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actionSpacer: {
    flex: 1,
  },
  actionSpacerCompact: {
    width: 8,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconButtonPressed: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  iconButtonActive: {
    borderColor: 'rgba(251, 113, 133, 0.4)',
  },
  equalizer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 3,
  },
  bar: {
    backgroundColor: colors.cyan,
    borderRadius: 4,
    width: 4,
  },
});

export default SongCard;
