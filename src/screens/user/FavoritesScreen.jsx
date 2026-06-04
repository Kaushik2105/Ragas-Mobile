import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import PageHeader from '../../components/common/PageHeader';
import AddToPlaylistModal from '../../components/songs/AddToPlaylistModal';
import FeedbackModal from '../../components/songs/FeedbackModal';
import SongCard from '../../components/songs/SongCard';
import { getFavoritesSongs, unwrap } from '../../utils/music';
import { screenStyles } from './screenStyles';
import Footer from '../../components/common/Footer';

const FavoritesScreen = () => {
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackSong, setFeedbackSong] = useState(null);
  const [playlistSong, setPlaylistSong] = useState(null);
  const songs = useMemo(() => getFavoritesSongs(favorites), [favorites]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [favoritesResponse, playlistsResponse] = await Promise.all([api.get('/favorites'), api.get('/playlists')]);
      setFavorites(unwrap(favoritesResponse));
      setPlaylists(unwrap(playlistsResponse));
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not load favorites' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeFavorite = async (song) => {
    try {
      await api.delete(`/favorites/${song.id}`);
      setFavorites((items) => items.filter((item) => item.song?.id !== song.id));
      Toast.show({ type: 'success', text1: 'Removed from favorites' });
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not remove favorite' });
    }
  };

  if (loading) return <Loader label="Loading favorites" />;

  return (
    <ScrollView contentContainerStyle={[screenStyles.screen, screenStyles.section]} showsVerticalScrollIndicator={false}>
      <PageHeader eyebrow="Favorites" title="Songs you kept close" description="A quick lane back to your saved tracks." />
      {songs.length === 0 ? (
        <EmptyState title="No favorites yet" message="Tap the heart on any song and it will land here." />
      ) : songs.map((song) => (
        <SongCard key={song.id} song={song} songs={songs} isFavorite onFavorite={removeFavorite} onAddToPlaylist={setPlaylistSong} onFeedback={setFeedbackSong} compact />
      ))}
      <FeedbackModal song={feedbackSong} onClose={() => setFeedbackSong(null)} />
      <AddToPlaylistModal song={playlistSong} playlists={playlists} onClose={() => setPlaylistSong(null)} />
      <Footer />
    </ScrollView>
  );
};

export default FavoritesScreen;
