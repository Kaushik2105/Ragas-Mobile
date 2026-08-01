import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/axios';
import { GhostButton, PrimaryButton } from '../../components/common/Buttons';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import PageHeader from '../../components/common/PageHeader';
import Panel from '../../components/common/Panel';
import SongCard from '../../components/songs/SongCard';
import useAuthStore from '../../store/authStore';
import usePlayerStore from '../../store/playerStore';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import { assetUrl, formatPlayCount, playlistPlayCount, unwrap } from '../../utils/music';
import { screenStyles } from './screenStyles';
import Footer from '../../components/common/Footer';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const PlaylistsScreen = ({ navigation, route }) => {
  const { user } = useAuthStore();
  const { playSong } = usePlayerStore();

  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'mine' | 'public' | 'songs'
  
  const transitionToView = (nextView) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentView(nextView);
  };

  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'public' (tracks previous tab for back navigation)
  const [playlists, setPlaylists] = useState([]);
  const [publicPlaylists, setPublicPlaylists] = useState([]);
  const [pinnedPlaylistIds, setPinnedPlaylistIds] = useState([]);
  const [activePlaylist, setActivePlaylist] = useState(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [response, publicResponse] = await Promise.all([
        api.get('/playlists'),
        api.get('/playlists/public'),
      ]);
      const data = unwrap(response);
      const publicData = unwrap(publicResponse);
      setPlaylists(data);
      setPublicPlaylists(publicData);

      // Load pin data
      if (user?.id) {
        const storedPins = await AsyncStorage.getItem(`pinnedPlaylists_${user.id}`);
        if (storedPins) {
          setPinnedPlaylistIds(JSON.parse(storedPins));
        }
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not load playlists' });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Handle routing params (for deep links from home)
  useEffect(() => {
    if (route.params?.playlistId) {
      const fetchPlaylistDetail = async () => {
        setLoading(true);
        try {
          const detailResponse = await api.get(`/playlists/${route.params.playlistId}`);
          const pData = unwrap(detailResponse);
          setActivePlaylist(pData);
          
          // Determine if owned
          if (pData.userId === user?.id) {
            setActiveTab('mine');
          } else {
            setActiveTab('public');
          }
          transitionToView('songs');
        } catch (error) {
          Toast.show({ type: 'error', text1: 'Could not load playlist details' });
          transitionToView('landing');
        } finally {
          setLoading(false);
        }
      };
      fetchPlaylistDetail();
    } else if (route.params?.tab === 'public') {
      transitionToView('public');
      setActiveTab('public');
    } else if (route.params?.tab === 'mine') {
      transitionToView('mine');
      setActiveTab('mine');
    } else {
      transitionToView('landing');
    }
  }, [route.params?.playlistId, route.params?.tab, user?.id]);

  const togglePinPlaylist = async (playlistId) => {
    if (!user?.id) return;
    try {
      let nextPins = [...pinnedPlaylistIds];
      if (pinnedPlaylistIds.includes(playlistId)) {
        nextPins = nextPins.filter((id) => id !== playlistId);
        Toast.show({ type: 'success', text1: 'Playlist unpinned' });
      } else {
        if (nextPins.length >= 3) {
          Toast.show({ type: 'error', text1: 'You can only pin up to 3 playlists.' });
          return;
        }
        nextPins.push(playlistId);
        Toast.show({ type: 'success', text1: 'Playlist pinned' });
      }
      setPinnedPlaylistIds(nextPins);
      await AsyncStorage.setItem(`pinnedPlaylists_${user.id}`, JSON.stringify(nextPins));
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to update pin state' });
    }
  };

  const createPlaylist = async () => {
    if (!name.trim()) return;
    setActionLoading(true);
    try {
      const response = await api.post('/playlists', { name: name.trim(), isPublic });
      const newPlaylist = unwrap(response);
      setPlaylists([newPlaylist, ...playlists]);
      setActivePlaylist(newPlaylist);
      setActiveTab('mine');
      transitionToView('songs');
      setName('');
      setIsPublic(false);
      setCreateModalOpen(false);
      Toast.show({ type: 'success', text1: 'Playlist created successfully' });
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not create playlist' });
    } finally {
      setActionLoading(false);
    }
  };

  const selectPlaylist = async (playlist) => {
    if (activeTab === 'public') {
      setActivePlaylist(playlist);
      transitionToView('songs');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(`/playlists/${playlist.id}`);
      setActivePlaylist(unwrap(response));
      transitionToView('songs');
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not open playlist' });
    } finally {
      setLoading(false);
    }
  };

  const removePlaylist = async () => {
    if (!activePlaylist) return;
    setActionLoading(true);
    try {
      await api.delete(`/playlists/${activePlaylist.id}`);
      Toast.show({ type: 'success', text1: 'Playlist deleted' });
      setActivePlaylist(null);
      transitionToView('mine');
      load();
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not delete playlist' });
    } finally {
      setActionLoading(false);
    }
  };

  const removeSong = async (song) => {
    if (activeTab !== 'mine') return;
    try {
      await api.delete(`/playlists/${activePlaylist.id}/songs/${song.id}`);
      const response = await api.get(`/playlists/${activePlaylist.id}`);
      setActivePlaylist(unwrap(response));
      Toast.show({ type: 'success', text1: 'Song removed from playlist' });
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not remove song' });
    }
  };

  const handleBackPress = () => {
    if (currentView === 'songs') {
      // Go back to the listing view we came from
      transitionToView(activeTab);
    } else if (currentView === 'mine' || currentView === 'public') {
      // Go back to the landing options
      transitionToView('landing');
    } else {
      // If we are on landing, standard navigation back
      navigation.goBack();
    }
  };

  const list = activeTab === 'mine' ? playlists : publicPlaylists;
  const filteredList = list.filter((playlist) =>
    playlist.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <Loader label="Loading playlists..." />;

  return (
    <View style={styles.container}>
      {/* Header Navigation Bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={handleBackPress} style={styles.backButton}>
          <Feather name="arrow-left" size={18} color={colors.cyan} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        
        {currentView !== 'songs' && (
          <Pressable onPress={() => setCreateModalOpen(true)} style={styles.composeButton}>
            <Feather name="plus" size={16} color={colors.white} />
            <Text style={styles.composeText}>Create Playlist</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* VIEW 1: LANDING VIEW */}
        {currentView === 'landing' && (
          <View style={styles.landingContainer}>
            <PageHeader
              eyebrow="Playlists Hub"
              title="Build your worlds"
              description="Arrange songs from the catalog, create custom lists, and explore shared public music collections."
            />
            
            <View style={styles.optionsList}>
              {/* Option A: Create Playlist */}
              <Pressable onPress={() => setCreateModalOpen(true)} style={[styles.optionCard, styles.optionCreate]}>
                <View style={[styles.optionIconContainer, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}>
                  <Feather name="plus" size={24} color={colors.cyan} />
                </View>
                <View style={styles.optionMeta}>
                  <Text style={styles.optionTitle}>Create Playlist</Text>
                  <Text style={styles.optionDesc}>Assemble a new custom collection of songs</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.muted} />
              </Pressable>

              {/* Option B: My Playlists */}
              <Pressable onPress={() => { setActiveTab('mine'); transitionToView('mine'); setSearchQuery(''); }} style={styles.optionCard}>
                <View style={[styles.optionIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                  <MaterialCommunityIcons name="playlist-music" size={26} color={colors.accent} />
                </View>
                <View style={styles.optionMeta}>
                  <Text style={styles.optionTitle}>My Playlists</Text>
                  <Text style={styles.optionDesc}>Your private and published creations · {playlists.length}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.muted} />
              </Pressable>

              {/* Option C: Public Playlists */}
              <Pressable onPress={() => { setActiveTab('public'); transitionToView('public'); setSearchQuery(''); }} style={styles.optionCard}>
                <View style={[styles.optionIconContainer, { backgroundColor: 'rgba(251, 113, 133, 0.15)' }]}>
                  <Feather name="globe" size={22} color={colors.pink} />
                </View>
                <View style={styles.optionMeta}>
                  <Text style={styles.optionTitle}>Public Playlists</Text>
                  <Text style={styles.optionDesc}>Explore public playlists from the community · {publicPlaylists.length}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
            </View>
          </View>
        )}

        {/* VIEW 2: LISTING VIEW (MY OR PUBLIC) */}
        {(currentView === 'mine' || currentView === 'public') && (
          <View style={styles.listContainer}>
            <PageHeader
              eyebrow={currentView === 'mine' ? 'Personal Collections' : 'Community Shared'}
              title={currentView === 'mine' ? 'My Playlists' : 'Public Playlists'}
              description={currentView === 'mine' ? 'Playlists created by you. Pin up to 3 to keep them on your Home rail.' : 'Top public playlists curated by the community.'}
            />

            {/* Search Input Bar */}
            <View style={styles.searchContainer}>
              <Feather name="search" size={16} color={colors.muted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search playlists by name..."
                placeholderTextColor="rgba(148, 163, 184, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} style={styles.searchClear}>
                  <Feather name="x" size={14} color={colors.muted} />
                </Pressable>
              )}
            </View>

            {/* Playlist Listings */}
            {filteredList.length > 0 ? (
              <View style={styles.playlistItemsList}>
                {filteredList.map((playlist) => {
                  const coverSong = playlist.songs?.find((song) => song.coverImage) || playlist.songs?.[0];
                  const isPinned = pinnedPlaylistIds.includes(playlist.id);

                  return (
                    <Pressable
                      key={playlist.id}
                      onPress={() => selectPlaylist(playlist)}
                      style={[styles.playlistItemRow, isPinned && styles.pinnedItemRow]}
                    >
                      {coverSong?.coverImage ? (
                        <Image source={{ uri: assetUrl(coverSong.coverImage) }} style={styles.playlistRowArt} />
                      ) : (
                        <View style={styles.playlistRowArtFallback}>
                          <Feather name="music" size={18} color={colors.cyan} />
                        </View>
                      )}
                      
                      <View style={styles.playlistRowMeta}>
                        <Text numberOfLines={1} style={styles.playlistRowName}>
                          {playlist.name}
                        </Text>
                        <Text style={styles.playlistRowSub}>
                          {currentView === 'public' && playlist.owner?.name ? `by ${playlist.owner.name} · ` : ''}
                          {playlist.songs?.length || 0} songs · {formatPlayCount(playlistPlayCount(playlist))} plays
                        </Text>
                      </View>

                      {/* Pin button */}
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          togglePinPlaylist(playlist.id);
                        }}
                        style={styles.playlistItemPin}
                      >
                        <MaterialCommunityIcons
                          name={isPinned ? "pin" : "pin-outline"}
                          size={16}
                          color={isPinned ? colors.pink : colors.muted}
                        />
                      </Pressable>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <EmptyState
                title={searchQuery.length > 0 ? "No search results" : "No playlists here"}
                message={searchQuery.length > 0 ? "Try searching for a different name." : currentView === 'mine' ? "You haven't created any playlists yet. Tap Create Playlist above." : "There are no public playlists available."}
              />
            )}
          </View>
        )}

        {/* VIEW 3: PLAYLIST SONGS VIEW */}
        {currentView === 'songs' && activePlaylist && (
          <View style={styles.detailContainer}>
            {/* Playlist Header Details */}
            <Panel style={styles.detailHeaderPanel}>
              <View style={styles.detailHeaderLayout}>
                <View style={styles.detailArtFrame}>
                  {activePlaylist.songs?.find((s) => s.coverImage) ? (
                    <Image
                      source={{ uri: assetUrl(activePlaylist.songs.find((s) => s.coverImage).coverImage) }}
                      style={styles.detailArtImage}
                    />
                  ) : (
                    <Feather name="music" size={32} color={colors.cyan} />
                  )}
                </View>

                <View style={styles.detailHeaderMeta}>
                  <View style={styles.detailHeaderBadgeRow}>
                    <Text style={styles.detailHeaderBadgeText}>
                      {activePlaylist.isPublic ? 'Public Playlist' : 'Private Playlist'}
                    </Text>
                    <Feather name={activePlaylist.isPublic ? 'unlock' : 'lock'} size={11} color={colors.muted} />
                  </View>
                  <Text style={styles.detailPlaylistTitle}>{activePlaylist.name}</Text>
                  {activePlaylist.owner?.name ? (
                    <Text style={styles.detailPlaylistCurator}>Curated by {activePlaylist.owner.name}</Text>
                  ) : null}
                  <Text style={styles.detailPlaylistStats}>
                    {activePlaylist.songs?.length || 0} tracks · {formatPlayCount(playlistPlayCount(activePlaylist))} plays
                  </Text>
                </View>
              </View>

              <View style={styles.detailHeaderActions}>
                {activePlaylist.songs?.length > 0 && (
                  <Pressable
                    onPress={() => playSong(activePlaylist.songs[0], activePlaylist.songs)}
                    style={[styles.buttonWrap, styles.detailPlayBtn]}
                  >
                    <LinearGradient
                      colors={[colors.accent, colors.cyan]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.primaryBtnGradient}
                    >
                      <Feather name="play" size={16} color={colors.dark} style={{ marginRight: 6 }} />
                      <Text style={styles.primaryBtnText}>Play Playlist</Text>
                    </LinearGradient>
                  </Pressable>
                )}

                {activePlaylist.userId === user?.id && (
                  <GhostButton danger onPress={removePlaylist} style={styles.detailDeleteBtn}>
                    <View style={styles.buttonRow}>
                      <Feather name="trash-2" size={16} color="#fecdd3" style={{ marginRight: 6 }} />
                      <Text style={styles.dangerBtnText}>Delete Playlist</Text>
                    </View>
                  </GhostButton>
                )}
              </View>
            </Panel>

            {/* Songs Grid */}
            <View style={styles.songsListHeading}>
              <Text style={styles.songsListTitle}>Tracks inside playlist</Text>
            </View>

            {activePlaylist.songs?.length ? (
              <View style={styles.songsWrapper}>
                {activePlaylist.songs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    songs={activePlaylist.songs}
                    onRemoveFromPlaylist={activePlaylist.userId === user?.id ? removeSong : undefined}
                    compact
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                title="Playlist is empty"
                message="Use the list button (+) on songs from Home or Search to add tracks here."
              />
            )}
          </View>
        )}

        <Footer />
      </ScrollView>

      {/* CREATE PLAYLIST MODAL */}
      <Modal visible={createModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <Panel style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Playlist</Text>
              <Pressable onPress={() => setCreateModalOpen(false)}>
                <Feather name="x" size={20} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.modalInputLabel}>Playlist Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="E.g. Ambient Chill, Midnight Synthwave..."
                placeholderTextColor="rgba(156, 163, 175, 0.5)"
                value={name}
                onChangeText={setName}
                autoFocus
              />

              <View style={styles.modalSwitchRow}>
                <View style={styles.modalSwitchMeta}>
                  <Text style={styles.modalSwitchTitle}>Make Public</Text>
                  <Text style={styles.modalSwitchDesc}>Allows other listeners to see and play this playlist</Text>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  thumbColor={isPublic ? colors.cyan : colors.muted}
                  trackColor={{ true: 'rgba(34, 211, 238, 0.35)', false: 'rgba(148, 163, 184, 0.2)' }}
                />
              </View>

              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.cyan} style={styles.modalLoading} />
              ) : (
                <PrimaryButton onPress={createPlaylist} style={styles.modalSubmit}>
                  Create Playlist
                </PrimaryButton>
              )}
            </View>
          </Panel>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 8,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingRight: 12,
  },
  backText: {
    color: colors.cyan,
    fontFamily: font.bold,
    fontSize: 14,
  },
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    borderColor: 'rgba(34, 211, 238, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 4,
  },
  composeText: {
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  landingContainer: {
    gap: 16,
  },
  optionsList: {
    gap: 12,
    marginTop: 8,
  },
  optionCard: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  optionCreate: {
    borderColor: 'rgba(34, 211, 238, 0.28)',
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionMeta: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    color: colors.text,
    fontFamily: font.extra,
    fontSize: 16,
  },
  optionDesc: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
  },
  listContainer: {
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panelSoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: font.semi,
    fontSize: 14,
    paddingVertical: 8,
  },
  searchClear: {
    padding: 6,
  },
  playlistItemsList: {
    gap: 10,
  },
  playlistItemRow: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  pinnedItemRow: {
    borderColor: 'rgba(251, 113, 133, 0.35)',
    backgroundColor: 'rgba(20, 22, 36, 0.96)',
  },
  playlistRowArt: {
    width: 44,
    height: 44,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  playlistRowArtFallback: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistRowMeta: {
    flex: 1,
    gap: 3,
  },
  playlistRowName: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 15,
  },
  playlistRowSub: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
  },
  playlistItemPin: {
    padding: 10,
  },
  detailContainer: {
    gap: 16,
  },
  detailHeaderPanel: {
    gap: 16,
    padding: 16,
  },
  detailHeaderLayout: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  detailArtFrame: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  detailArtImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailHeaderMeta: {
    flex: 1,
    gap: 4,
  },
  detailHeaderBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailHeaderBadgeText: {
    color: colors.cyan,
    fontFamily: font.bold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailPlaylistTitle: {
    color: colors.text,
    fontFamily: font.extra,
    fontSize: 20,
    lineHeight: 24,
  },
  detailPlaylistCurator: {
    color: colors.text,
    fontFamily: font.semi,
    fontSize: 13,
  },
  detailPlaylistStats: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
  },
  detailHeaderActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  detailPlayBtn: {
    flex: 1.4,
    height: 40,
  },
  detailDeleteBtn: {
    flex: 1,
    height: 40,
  },
  songsListHeading: {
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  songsListTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 16,
  },
  songsWrapper: {
    gap: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalContent: {
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: colors.text,
    fontFamily: font.extra,
    fontSize: 18,
  },
  modalForm: {
    gap: 14,
  },
  modalInputLabel: {
    color: colors.muted,
    fontFamily: font.bold,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    color: colors.text,
    fontFamily: font.semi,
    fontSize: 15,
    paddingHorizontal: 14,
    height: 46,
  },
  modalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 4,
  },
  modalSwitchMeta: {
    flex: 1,
    gap: 2,
    paddingRight: 10,
  },
  modalSwitchTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 14,
  },
  modalSwitchDesc: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11,
  },
  modalSubmit: {
    height: 46,
    marginTop: 8,
  },
  modalLoading: {
    marginVertical: 18,
  },
  buttonWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  primaryBtnText: {
    color: colors.dark,
    fontFamily: font.extra,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  dangerBtnText: {
    color: '#fecdd3',
    fontFamily: font.bold,
    fontSize: 14,
  },
});

export default PlaylistsScreen;
