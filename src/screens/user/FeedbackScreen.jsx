import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import PageHeader from '../../components/common/PageHeader';
import Panel from '../../components/common/Panel';
import FeedbackModal from '../../components/songs/FeedbackModal';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import { initials, unwrap } from '../../utils/music';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const FeedbackScreen = () => {
  const navigation = useNavigation();
  const [feedbacks, setFeedbacks] = useState([]);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters and Modals
  const [selectedSongFilter, setSelectedSongFilter] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composeSong, setComposeSong] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadFeedbacks = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const url = selectedSongFilter
        ? `/feedback?limit=80&songId=${encodeURIComponent(selectedSongFilter.id)}`
        : '/feedback?limit=80';
      const response = await api.get(url);
      setFeedbacks(unwrap(response).feedbacks || []);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not load feedback',
        text2: error.response?.data?.message || 'Try again later',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSongFilter]);

  const loadSongs = useCallback(async () => {
    try {
      const response = await api.get('/songs?limit=100');
      const songItems = unwrap(response).songs || unwrap(response) || [];
      setSongs(songItems);
    } catch (error) {
      console.warn('Could not load songs for filtering:', error);
    }
  }, []);

  useEffect(() => {
    loadFeedbacks();
    loadSongs();
  }, [loadFeedbacks, loadSongs]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFeedbacks(true);
  };

  // Optimistic UI updates for emoji reactions
  const reactToFeedback = async (feedbackId, emoji) => {
    const currentItem = feedbacks.find((item) => item.id === feedbackId);
    if (!currentItem) return;

    const isToggledOff = currentItem.userReaction === emoji;

    // Apply optimistic updates to the UI immediately
    setFeedbacks((items) =>
      items.map((item) => {
        if (item.id !== feedbackId) return item;

        const previousEmoji = item.userReaction;
        const reactions = { ...(item.reactions || {}) };

        if (previousEmoji) {
          reactions[previousEmoji] = Math.max((Number(reactions[previousEmoji]) || 0) - 1, 0);
        }
        if (!isToggledOff) {
          reactions[emoji] = (Number(reactions[emoji]) || 0) + 1;
        }

        return {
          ...item,
          reactions,
          userReaction: isToggledOff ? null : emoji,
        };
      })
    );

    try {
      const response = await api.post(`/feedback/${feedbackId}/react`, { emoji });
      const updated = unwrap(response);

      // Re-sync state with response payload
      setFeedbacks((items) =>
        items.map((item) =>
          item.id === feedbackId
            ? {
                ...item,
                reactions: (updated && updated.reactions) || item.reactions,
                userReaction:
                  updated && typeof updated.userReaction !== 'undefined'
                    ? updated.userReaction
                    : isToggledOff
                    ? null
                    : emoji,
              }
            : item
        )
      );
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Reaction failed',
        text2: error.response?.data?.message || 'Could not update reaction',
      });
      // Fallback reload
      loadFeedbacks(true);
    }
  };

  // Render a single feedback card
  const renderFeedbackCard = ({ item }) => {
    const stars = Array(5).fill(false).map((_, i) => i < item.rating);
    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';

    return (
      <Panel style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(item.user?.name || 'MS')}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.author}>{item.user?.name || 'Anonymous'}</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
          {item.isPinned && (
            <View style={styles.pinned}>
              <Feather name="pin" size={12} color={colors.cyan} />
              <Text style={styles.pinnedText}>Pinned</Text>
            </View>
          )}
        </View>

        <View style={styles.songDetails}>
          <Feather name="music" size={13} color={colors.pink} />
          <Text style={styles.songName} numberOfLines={1}>
            {item.song?.title || 'Unknown Song'}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            · {item.song?.artist || 'Unknown Artist'}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          {stars.map((active, idx) => (
            <Text key={idx} style={[styles.star, active && styles.starActive]}>
              ★
            </Text>
          ))}
        </View>

        <Text style={styles.comment}>{item.comment}</Text>

        <View style={styles.reactionsBar}>
          {REACTION_EMOJIS.map((emoji) => {
            const count = item.reactions?.[emoji] || 0;
            const isUserReaction = item.userReaction === emoji;

            return (
              <Pressable
                key={emoji}
                onPress={() => reactToFeedback(item.id, emoji)}
                style={[styles.emojiButton, isUserReaction && styles.emojiButtonActive]}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
                {count > 0 && <Text style={styles.emojiCount}>{count}</Text>}
              </Pressable>
            );
          })}
        </View>
      </Panel>
    );
  };

  const filteredSongs = songs.filter(
    (song) =>
      song.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Custom Back & Control Bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={18} color={colors.cyan} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable onPress={() => setComposeModalOpen(true)} style={styles.composeButton}>
          <Feather name="plus" size={16} color={colors.white} />
          <Text style={styles.composeText}>Add Feedback</Text>
        </Pressable>
      </View>

      {/* Main Title & Description */}
      <View style={styles.titleWrap}>
        <PageHeader
          eyebrow="Community Wall"
          title="Feedback"
          description="Read what other listeners felt, react with emojis, or drop your own feedback."
        />
      </View>

      {/* Filter Button */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Track:</Text>
        <Pressable onPress={() => setFilterModalOpen(true)} style={styles.filterSelect}>
          <Text style={styles.filterSelectText} numberOfLines={1}>
            {selectedSongFilter
              ? `${selectedSongFilter.title} · ${selectedSongFilter.artist}`
              : 'All Tracks'}
          </Text>
          <Feather name="chevron-down" size={16} color={colors.muted} />
        </Pressable>
        {selectedSongFilter && (
          <Pressable
            onPress={() => setSelectedSongFilter(null)}
            style={styles.clearFilter}
          >
            <Feather name="x" size={14} color={colors.pink} />
          </Pressable>
        )}
      </View>

      {/* Feedbacks List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cyan} />
          <Text style={styles.loadingText}>Fetching community reviews...</Text>
        </View>
      ) : (
        <FlatList
          data={feedbacks}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderFeedbackCard}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="message-square" size={38} color={colors.muted} style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No feedback yet</Text>
              <Text style={styles.emptyText}>
                {selectedSongFilter
                  ? 'Be the first to review this song! Tap Add Feedback above.'
                  : 'Start the conversation by sharing your notes.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Filter Selector Modal */}
      <Modal visible={filterModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <Panel style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Song Filter</Text>
              <Pressable onPress={() => setFilterModalOpen(false)}>
                <Feather name="x" size={20} color={colors.text} />
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search title or artist..."
              placeholderTextColor="rgba(156, 163, 175, 0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={[{ id: 'all', title: 'All Tracks', artist: '' }, ...filteredSongs]}
              keyExtractor={(item) => String(item.id)}
              style={styles.modalList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedSongFilter(item.id === 'all' ? null : item);
                    setFilterModalOpen(false);
                    setSearchQuery('');
                  }}
                  style={styles.modalItem}
                >
                  <Text style={styles.modalSongTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.artist ? (
                    <Text style={styles.modalSongArtist} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  ) : null}
                </Pressable>
              )}
            />
          </Panel>
        </View>
      </Modal>

      {/* Compose Selection Modal */}
      <Modal visible={composeModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <Panel style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Track to Review</Text>
              <Pressable
                onPress={() => {
                  setComposeModalOpen(false);
                  setSearchQuery('');
                }}
              >
                <Feather name="x" size={20} color={colors.text} />
              </Pressable>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search track to review..."
              placeholderTextColor="rgba(156, 163, 175, 0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredSongs}
              keyExtractor={(item) => String(item.id)}
              style={styles.modalList}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setComposeSong(item);
                    setComposeModalOpen(false);
                    setSearchQuery('');
                  }}
                  style={styles.modalItem}
                >
                  <Text style={styles.modalSongTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.modalSongArtist} numberOfLines={1}>
                    {item.artist}
                  </Text>
                </Pressable>
              )}
            />
          </Panel>
        </View>
      </Modal>

      {/* Feedback Composer Modal */}
      <FeedbackModal
        song={composeSong}
        onClose={() => {
          setComposeSong(null);
          loadFeedbacks(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 58,
    backgroundColor: colors.bg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: colors.cyan,
    fontFamily: font.bold,
    fontSize: 14,
  },
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  composeText: {
    color: colors.white,
    fontFamily: font.bold,
    fontSize: 13,
  },
  titleWrap: {
    marginBottom: 16,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  filterLabel: {
    color: colors.muted,
    fontFamily: font.semi,
    fontSize: 13,
    marginRight: 6,
  },
  filterSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterSelectText: {
    color: colors.cyan,
    fontFamily: font.bold,
    fontSize: 13,
    maxWidth: '85%',
  },
  clearFilter: {
    paddingLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 14,
  },
  list: {
    paddingBottom: 250,
    gap: 16,
  },
  card: {
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(168, 85, 247, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 14,
  },
  meta: {
    flex: 1,
  },
  author: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 14,
  },
  date: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 11,
    marginTop: 1,
  },
  pinned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 4,
  },
  pinnedText: {
    color: colors.cyan,
    fontFamily: font.bold,
    fontSize: 10,
  },
  songDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
    maxWidth: '100%',
  },
  songName: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 12,
    maxWidth: '60%',
  },
  songArtist: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
    maxWidth: '30%',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 3,
  },
  star: {
    color: 'rgba(156, 163, 175, 0.25)',
    fontSize: 18,
  },
  starActive: {
    color: '#facc15',
  },
  comment: {
    color: colors.text,
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  reactionsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  emojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  emojiButtonActive: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderColor: colors.cyan,
  },
  emojiText: {
    fontSize: 14,
  },
  emojiCount: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 11,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIcon: {
    opacity: 0.6,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 18,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '80%',
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: colors.text,
    fontFamily: font.black,
    fontSize: 20,
  },
  searchInput: {
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontFamily: font.regular,
    height: 48,
    paddingHorizontal: 14,
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalSongTitle: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 15,
  },
  modalSongArtist: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 13,
    marginTop: 2,
  },
});

export default FeedbackScreen;
