import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import EmptyState from '../../components/common/EmptyState';
import Footer from '../../components/common/Footer';
import PageHeader from '../../components/common/PageHeader';
import SongCard from '../../components/songs/SongCard';
import { getDownloadedSongs } from '../../utils/offlineSongs';
import { screenStyles } from './screenStyles';

const DownloadsScreen = () => {
  const [songs, setSongs] = useState([]);

  const loadDownloads = useCallback(async () => {
    try {
      setSongs(await getDownloadedSongs());
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not load downloads',
        text2: error?.message || 'Try reopening the app',
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDownloads();
    }, [loadDownloads])
  );

  return (
    <ScrollView contentContainerStyle={[screenStyles.screen, screenStyles.section]} showsVerticalScrollIndicator={false}>
      <PageHeader
        eyebrow="Downloads"
        title="Offline songs"
        description="Your downloaded songs stay available when the internet is off."
      />
      {songs.length ? (
        songs.map((song) => (
          <SongCard
            key={song.id}
            song={song}
            songs={songs}
            onDownloadChange={loadDownloads}
            compact
          />
        ))
      ) : (
        <EmptyState
          icon="download"
          title="No downloads yet"
          message="Use the three-dot menu on any song and tap Download offline."
        />
      )}
      <Footer />
    </ScrollView>
  );
};

export default DownloadsScreen;
