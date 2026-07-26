import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import { GhostButton, PrimaryButton } from '../../components/common/Buttons';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import PageHeader from '../../components/common/PageHeader';
import Panel from '../../components/common/Panel';
import TextInputField from '../../components/common/TextInputField';
import SongCard from '../../components/songs/SongCard';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import { formatPlayCount, playlistPlayCount, unwrap } from '../../utils/music';
import { screenStyles } from './screenStyles';
import Footer from '../../components/common/Footer';

const PlaylistsScreen = ({ navigation, route }) => {
  const initialTab = route?.params?.tab === 'public' ? 'public' : 'mine';
  const [playlists, setPlaylists] = useState([]);
  const [publicPlaylists, setPublicPlaylists] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [response, publicResponse] = await Promise.all([api.get('/playlists'), api.get('/playlists/public')]);
      const data = unwrap(response);
      const publicData = unwrap(publicResponse);
      setPlaylists(data);
      setPublicPlaylists(publicData);
      setActivePlaylist(activeTab === 'public' ? publicData[0] || null : data[0] || null);
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not load playlists' });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  const createPlaylist = async () => {
    if (!name.trim()) return;
    try {
      const response = await api.post('/playlists', { name: name.trim(), isPublic });
      const newPlaylist = unwrap(response);
      setPlaylists([newPlaylist, ...playlists]);
      setActivePlaylist(newPlaylist);
      setActiveTab('mine');
      setName('');
      setIsPublic(false);
      Toast.show({ type: 'success', text1: 'Playlist created' });
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not create playlist' });
    }
  };

  const selectPlaylist = async (playlist) => {
    if (activeTab === 'public') {
      setActivePlaylist(playlist);
      return;
    }
    try {
      const response = await api.get(`/playlists/${playlist.id}`);
      setActivePlaylist(unwrap(response));
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not open playlist' });
    }
  };

  const removePlaylist = async () => {
    if (!activePlaylist) return;
    try {
      await api.delete(`/playlists/${activePlaylist.id}`);
      Toast.show({ type: 'success', text1: 'Playlist deleted' });
      setActivePlaylist(null);
      load();
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not delete playlist' });
    }
  };

  const removeSong = async (song) => {
    if (activeTab !== 'mine') return;
    try {
      await api.delete(`/playlists/${activePlaylist.id}/songs/${song.id}`);
      const response = await api.get(`/playlists/${activePlaylist.id}`);
      setActivePlaylist(unwrap(response));
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not remove song' });
    }
  };

  const list = activeTab === 'mine' ? playlists : publicPlaylists;

  if (loading) return <Loader label="Loading playlists" />;

  return (
    <ScrollView contentContainerStyle={[screenStyles.screen, screenStyles.section]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Feather name="arrow-left" size={16} color={colors.cyan} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <PageHeader eyebrow="Playlists" title="Build little worlds" description="Create personal or public playlists and arrange songs from the catalog." />
      <Panel style={styles.form}>
        <TextInputField placeholder="New playlist name" value={name} onChangeText={setName} />
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Public</Text>
          <Switch value={isPublic} onValueChange={setIsPublic} thumbColor={isPublic ? colors.cyan : colors.muted} trackColor={{ true: 'rgba(34, 211, 238, 0.35)', false: 'rgba(148, 163, 184, 0.2)' }} />
        </View>
        <PrimaryButton onPress={createPlaylist}>Create playlist</PrimaryButton>
      </Panel>
      <View style={styles.tabs}>
        <GhostButton active={activeTab === 'mine'} onPress={() => { setActiveTab('mine'); setActivePlaylist(playlists[0] || null); }} style={styles.tab}>My Playlists</GhostButton>
        <GhostButton active={activeTab === 'public'} onPress={() => { setActiveTab('public'); setActivePlaylist(publicPlaylists[0] || null); }} style={styles.tab}>Public</GhostButton>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {list.map((playlist) => (
          <Pressable key={playlist.id} onPress={() => selectPlaylist(playlist)} style={[styles.chip, activePlaylist?.id === playlist.id && styles.activeChip]}>
            <Text numberOfLines={1} style={styles.chipTitle}>{playlist.name}</Text>
            <View style={styles.chipMeta}>
              <Text style={styles.chipMetaText}>{activeTab === 'public' ? `${formatPlayCount(playlistPlayCount(playlist))} plays` : playlist.isPublic ? 'Public' : 'Private'}</Text>
              <Feather name={playlist.isPublic ? 'unlock' : 'lock'} size={13} color={colors.muted} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Panel style={styles.detail}>
        {activePlaylist ? (
          <>
            <View style={screenStyles.row}>
              <View style={styles.heading}>
                <Text style={screenStyles.eyebrow}>{activePlaylist.isPublic ? 'Public' : 'Private'} playlist</Text>
                <Text style={styles.detailTitle}>{activePlaylist.name}</Text>
                {activeTab === 'public' && activePlaylist.owner?.name ? <Text style={screenStyles.muted}>Curated by {activePlaylist.owner.name}</Text> : null}
                <Text style={screenStyles.muted}>{formatPlayCount(playlistPlayCount(activePlaylist))} total plays</Text>
              </View>
              {activeTab === 'mine' ? (
                <GhostButton danger onPress={removePlaylist}>
                  <Feather name="trash-2" size={17} color="#fecdd3" />
                </GhostButton>
              ) : null}
            </View>
            {activePlaylist.songs?.length ? activePlaylist.songs.map((song) => (
              <SongCard key={song.id} song={song} songs={activePlaylist.songs} onRemoveFromPlaylist={activeTab === 'mine' ? removeSong : undefined} compact />
            )) : <EmptyState title="Playlist is empty" message="Use the list button on songs from Home or Search to add tracks." />}
          </>
        ) : (
          <EmptyState title="No playlist selected" message="Create or select a playlist to begin." />
        )}
      </Panel>
      <Footer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchText: {
    color: colors.muted,
    fontFamily: font.semi,
  },
  tabs: {
    flexDirection: 'row',
    gap: 10,
  },
  tab: {
    flex: 1,
  },
  chips: {
    gap: 10,
    paddingRight: 18,
  },
  chip: {
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 13,
    width: 180,
  },
  activeChip: {
    borderColor: 'rgba(168, 85, 247, 0.7)',
  },
  chipTitle: {
    color: colors.text,
    fontFamily: font.bold,
  },
  chipMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  chipMetaText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
  },
  detail: {
    gap: 14,
  },
  heading: {
    flex: 1,
    gap: 5,
  },
  detailTitle: {
    color: colors.text,
    fontFamily: font.extra,
    fontSize: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: -8,
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.cyan,
    fontFamily: font.bold,
    fontSize: 14,
  },
});

export default PlaylistsScreen;
