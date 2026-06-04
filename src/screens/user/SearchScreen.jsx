import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import TextInputField from '../../components/common/TextInputField';
import AddToPlaylistModal from '../../components/songs/AddToPlaylistModal';
import FeedbackModal from '../../components/songs/FeedbackModal';
import SongCard from '../../components/songs/SongCard';
import { colors } from '../../theme/colors';
import { getFavoritesSongs, getSongsFromPayload, unwrap } from '../../utils/music';
import { screenStyles } from './screenStyles';
import Footer from '../../components/common/Footer';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [feedbackSong, setFeedbackSong] = useState(null);
  const [playlistSong, setPlaylistSong] = useState(null);
  const favoriteIds = useMemo(() => new Set(getFavoritesSongs(favorites).map((song) => song.id)), [favorites]);

  useEffect(() => {
    const loadBasics = async () => {
      try {
        const [favoritesResponse, playlistsResponse] = await Promise.all([api.get('/favorites'), api.get('/playlists')]);
        setFavorites(unwrap(favoritesResponse));
        setPlaylists(unwrap(playlistsResponse));
      } catch (error) {
        Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not load library context' });
      }
    };
    loadBasics();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const endpoint = query.trim() ? `/songs/search?q=${encodeURIComponent(query.trim())}` : '/songs?limit=24';
        const response = await api.get(endpoint);
        setSongs(getSongsFromPayload(unwrap(response)));
      } catch (error) {
        setSongs([]);
        Toast.show({ type: 'error', text1: error.response?.data?.message || 'Search failed' });
      }
    }, 260);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleFavorite = async (song) => {
    try {
      if (favoriteIds.has(song.id)) await api.delete(`/favorites/${song.id}`);
      else await api.post(`/favorites/${song.id}`);
      const response = await api.get('/favorites');
      setFavorites(unwrap(response));
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Favorite update failed' });
    }
  };

  return (
    <ScrollView contentContainerStyle={[screenStyles.screen, screenStyles.section]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <PageHeader eyebrow="Search" title="Find the next hook" description="Search by title, artist, album, or genre with a real-time API-backed catalog." />
      <View style={styles.search}>
        <Feather name="search" size={18} color={colors.muted} />
        <TextInputField style={styles.input} placeholder="Try pop, ambient, an artist..." value={query} onChangeText={setQuery} />
      </View>
      {songs.length === 0 ? (
        <EmptyState title="No matches yet" message="Try another phrase or wait for the catalog to grow." />
      ) : songs.map((song) => (
        <SongCard key={song.id} song={song} songs={songs} isFavorite={favoriteIds.has(song.id)} onFavorite={toggleFavorite} onAddToPlaylist={setPlaylistSong} onFeedback={setFeedbackSong} compact />
      ))}
      <FeedbackModal song={feedbackSong} onClose={() => setFeedbackSong(null)} />
      <AddToPlaylistModal song={playlistSong} playlists={playlists} onClose={() => setPlaylistSong(null)} />
      <Footer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  search: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 14,
  },
  input: {
    flex: 1,
  },
});

export default SearchScreen;
