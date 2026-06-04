import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import PageHeader from '../../components/common/PageHeader';
import Panel from '../../components/common/Panel';
import AddToPlaylistModal from '../../components/songs/AddToPlaylistModal';
import FeedbackModal from '../../components/songs/FeedbackModal';
import SongCard from '../../components/songs/SongCard';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import { getFavoritesSongs, getSongsFromPayload, unwrap } from '../../utils/music';
import { screenStyles } from './screenStyles';
import Footer from '../../components/common/Footer';

const HomeScreen = () => {
  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackSong, setFeedbackSong] = useState(null);
  const [playlistSong, setPlaylistSong] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [songsResponse, favoritesResponse, playlistsResponse] = await Promise.all([
        api.get('/songs?limit=30'),
        api.get('/favorites'),
        api.get('/playlists'),
      ]);
      setSongs(getSongsFromPayload(unwrap(songsResponse)));
      setFavorites(unwrap(favoritesResponse));
      setPlaylists(unwrap(playlistsResponse));
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not load your music' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [glowAnim]);

  const animatedHeroStyle = {
    backgroundColor: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(168, 85, 247, 0.16)', 'rgba(168, 85, 247, 0.32)'],
    }),
    borderColor: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(168, 85, 247, 0.35)', 'rgba(34, 211, 238, 0.75)'],
    }),
    shadowColor: colors.cyan,
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.15, 0.45],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [12, 28],
    }),
  };

  const favoriteIds = useMemo(() => new Set(getFavoritesSongs(favorites).map((song) => song.id)), [favorites]);
  const featured = useMemo(() => [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 6), [songs]);
  const recentSongs = useMemo(() => [...songs].slice(0, 12), [songs]);

  const toggleFavorite = async (song) => {
    try {
      if (favoriteIds.has(song.id)) {
        await api.delete(`/favorites/${song.id}`);
        setFavorites((items) => items.filter((item) => item.song?.id !== song.id));
        Toast.show({ type: 'success', text1: 'Removed from favorites' });
      } else {
        await api.post(`/favorites/${song.id}`);
        const response = await api.get('/favorites');
        setFavorites(unwrap(response));
        Toast.show({ type: 'success', text1: 'Added to favorites' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Favorite update failed' });
    }
  };

  if (loading) return <Loader label="Loading the catalog" />;

  return (
    <ScrollView contentContainerStyle={[screenStyles.screen, screenStyles.section]} showsVerticalScrollIndicator={false}>
      <PageHeader eyebrow="RAGAS" title="Your neon listening room" description="Featured tracks, fresh uploads, favorites, and feedback stitched into one smooth dashboard." />
      {!songs.length ? (
        <EmptyState title="No songs yet" message="Ask an admin to upload tracks and this page will light up." />
      ) : (
        <>
          <Animated.View style={[styles.panel, styles.hero, animatedHeroStyle]}>
            <Text style={screenStyles.eyebrow}>Featured mix</Text>
            <Text style={styles.heroTitle}>{featured[0]?.title || 'Discover the stream'}</Text>
            <Text style={styles.heroCopy}>{featured[0] ? `${featured[0].artist} | ${featured[0].genre || 'Genre bending'}` : 'Your top played songs appear here.'}</Text>
            <View style={styles.stats}>
              <Text style={styles.stat}><Text style={styles.statStrong}>{songs.length}</Text> tracks</Text>
              <Text style={styles.stat}><Text style={styles.statStrong}>{favorites.length}</Text> favorites</Text>
              <Text style={styles.stat}><Text style={styles.statStrong}>{playlists.length}</Text> playlists</Text>
            </View>
          </Animated.View>

          <Text style={screenStyles.sectionTitle}>Featured</Text>
          {featured.map((song) => (
            <SongCard key={song.id} song={song} songs={songs} isFavorite={favoriteIds.has(song.id)} onFavorite={toggleFavorite} onAddToPlaylist={setPlaylistSong} onFeedback={setFeedbackSong} />
          ))}

          <Text style={screenStyles.sectionTitle}>Recently added</Text>
          {recentSongs.map((song) => (
            <SongCard key={song.id} song={song} songs={songs} isFavorite={favoriteIds.has(song.id)} onFavorite={toggleFavorite} onAddToPlaylist={setPlaylistSong} onFeedback={setFeedbackSong} compact />
          ))}
        </>
      )}
      <FeedbackModal song={feedbackSong} onClose={() => setFeedbackSong(null)} />
      <AddToPlaylistModal song={playlistSong} playlists={playlists} onClose={() => setPlaylistSong(null)} />
      <Footer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.26,
    shadowRadius: 34,
    elevation: 8,
  },
  hero: {
    gap: 10,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: font.black,
    fontSize: 34,
    lineHeight: 35,
  },
  heroCopy: {
    color: colors.muted,
    fontFamily: font.regular,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  stat: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.muted,
    fontFamily: font.regular,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statStrong: {
    color: colors.text,
    fontFamily: font.extra,
  },
});

export default HomeScreen;
