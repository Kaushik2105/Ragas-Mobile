import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import PageHeader from '../../components/common/PageHeader';
import AddToPlaylistModal from '../../components/songs/AddToPlaylistModal';
import FeedbackModal from '../../components/songs/FeedbackModal';
import SongCard from '../../components/songs/SongCard';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import { assetUrl, formatPlayCount, getFavoritesSongs, getSongsFromPayload, playlistPlayCount, songPlayCount, unwrap } from '../../utils/music';
import { screenStyles } from './screenStyles';
import Footer from '../../components/common/Footer';

const HomeScreen = ({ navigation }) => {
  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [publicPlaylists, setPublicPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackSong, setFeedbackSong] = useState(null);
  const [playlistSong, setPlaylistSong] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [songsResponse, favoritesResponse, playlistsResponse, publicPlaylistsResponse] = await Promise.all([
        api.get('/songs?limit=30'),
        api.get('/favorites'),
        api.get('/playlists'),
        api.get('/playlists/public'),
      ]);
      setSongs(getSongsFromPayload(unwrap(songsResponse)));
      setFavorites(unwrap(favoritesResponse));
      setPlaylists(unwrap(playlistsResponse));
      const publicData = unwrap(publicPlaylistsResponse);
      if (__DEV__ && publicData?.[0]) {
        console.log('Featured playlist play count payload', {
          keys: Object.keys(publicData[0]),
          total: playlistPlayCount(publicData[0]),
        });
      }
      setPublicPlaylists(publicData);
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not load your music' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const favoriteIds = useMemo(() => new Set(getFavoritesSongs(favorites).map((song) => song.id)), [favorites]);
  const featured = useMemo(
    () => [...songs].sort((a, b) => songPlayCount(b) - songPlayCount(a)).slice(0, 6),
    [songs]
  );
  const recentSongs = useMemo(() => [...songs].slice(0, 12), [songs]);
  const featuredPlaylists = useMemo(() => [...publicPlaylists].slice(0, 5), [publicPlaylists]);

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
          <View style={[styles.panel, styles.hero]}>
            <Text style={screenStyles.eyebrow}>Featured mix</Text>
            <Text style={styles.heroTitle}>{featured[0]?.title || 'Discover the stream'}</Text>
            <Text style={styles.heroCopy}>{featured[0] ? `${featured[0].artist} | ${featured[0].genre || 'Genre bending'}` : 'Your top played songs appear here.'}</Text>
            <View style={styles.stats}>
              <Text style={styles.stat}><Text style={styles.statStrong}>{songs.length}</Text> tracks</Text>
              <Text style={styles.stat}><Text style={styles.statStrong}>{favorites.length}</Text> favorites</Text>
              <Text style={styles.stat}><Text style={styles.statStrong}>{playlists.length}</Text> playlists</Text>
            </View>
          </View>

          {featuredPlaylists.length ? (
            <View style={styles.featuredPlaylists}>
              <View style={styles.sectionHeading}>
                <Text style={screenStyles.sectionTitle}>Featured Playlists</Text>
                <Pressable onPress={() => navigation.navigate('Playlists', { tab: 'public' })} style={styles.seeAllButton}>
                  <Text style={styles.seeAllText}>See all</Text>
                  <Feather name="arrow-right" size={15} color={colors.cyan} />
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playlistRail}>
                {featuredPlaylists.map((playlist) => {
                  const coverSong = playlist.songs?.find((song) => song.coverImage) || playlist.songs?.[0];
                  return (
                  <Pressable key={playlist.id} onPress={() => navigation.navigate('Playlists', { tab: 'public' })} style={styles.playlistCard}>
                    <View style={styles.playlistArt}>
                      {coverSong?.coverImage ? (
                        <Image source={{ uri: assetUrl(coverSong.coverImage) }} style={styles.playlistImage} />
                      ) : (
                        <Feather name="music" size={24} color={colors.cyan} />
                      )}
                    </View>
                    <Text numberOfLines={1} style={styles.playlistTitle}>{playlist.name}</Text>
                    <Text numberOfLines={1} style={styles.playlistOwner}>{playlist.owner?.name ? `by ${playlist.owner.name}` : 'Public playlist'}</Text>
                    <View style={styles.playlistStats}>
                      <Text style={styles.playlistStat}>{playlist.songs?.length || 0} songs</Text>
                      <Text style={styles.playlistStat}>{formatPlayCount(playlistPlayCount(playlist))} plays</Text>
                    </View>
                  </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <Text style={screenStyles.sectionTitle}>Featured</Text>
          <View style={styles.featuredSongGrid}>
            {featured.map((song) => (
              <View key={song.id} style={styles.featuredSongCell}>
                <SongCard song={song} songs={songs} isFavorite={favoriteIds.has(song.id)} onFavorite={toggleFavorite} onAddToPlaylist={setPlaylistSong} onFeedback={setFeedbackSong} featured />
              </View>
            ))}
          </View>

          <Text style={screenStyles.sectionTitle}>Recently added</Text>
          {recentSongs.map((song) => (
            <SongCard key={song.id} song={song} songs={songs} isFavorite={favoriteIds.has(song.id)} onFavorite={toggleFavorite} onAddToPlaylist={setPlaylistSong} onFeedback={setFeedbackSong} compact />
          ))}
        </>
      )}
      <FeedbackModal song={feedbackSong} onClose={() => setFeedbackSong(null)} />
      <AddToPlaylistModal song={playlistSong} playlists={playlists} onClose={() => setPlaylistSong(null)} onChange={load} />
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
  featuredPlaylists: {
    gap: 12,
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  seeAllButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  seeAllText: {
    color: colors.cyan,
    fontFamily: font.bold,
    fontSize: 13,
  },
  playlistRail: {
    gap: 12,
    paddingRight: 18,
  },
  playlistCard: {
    backgroundColor: colors.panelSoft,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 7,
    padding: 10,
    width: 178,
  },
  playlistArt: {
    alignItems: 'center',
    aspectRatio: 1.45,
    backgroundColor: 'rgba(168, 85, 247, 0.24)',
    borderRadius: 14,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  playlistImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  playlistTitle: {
    color: colors.text,
    fontFamily: font.extra,
    fontSize: 15,
  },
  playlistOwner: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
  },
  playlistStats: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  playlistStat: {
    color: colors.muted,
    fontFamily: font.bold,
    fontSize: 11,
  },
  featuredSongGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featuredSongCell: {
    flexBasis: '47%',
    flexGrow: 1,
    maxWidth: '50%',
  },
});

export default HomeScreen;
