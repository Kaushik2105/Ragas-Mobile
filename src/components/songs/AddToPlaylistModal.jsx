import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import Panel from '../common/Panel';

const AddToPlaylistModal = ({ song, playlists = [], onClose, onChange }) => {
  const changeMembership = async (playlist) => {
    const isInPlaylist = playlist.songs?.some((item) => item.id === song.id);
    try {
      if (isInPlaylist) {
        await api.delete(`/playlists/${playlist.id}/songs/${song.id}`);
        Toast.show({ type: 'success', text1: 'Removed from playlist' });
      } else {
        await api.post(`/playlists/${playlist.id}/songs`, { songId: song.id });
        Toast.show({ type: 'success', text1: 'Added to playlist' });
      }
      await onChange?.();
      onClose?.();
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not update playlist' });
    }
  };

  return (
    <Modal transparent visible={!!song} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Panel style={styles.modal}>
          <Text style={styles.title}>Add to playlist</Text>
          <Text style={styles.message}>{song?.title}</Text>
          {playlists.length ? (
            <ScrollView style={styles.scrollList} contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
              {playlists.map((playlist) => {
                const isInPlaylist = playlist.songs?.some((item) => item.id === song?.id);
                return (
                  <Pressable key={playlist.id} onPress={() => changeMembership(playlist)} style={[styles.item, isInPlaylist && styles.removeItem]}>
                    <Text style={styles.itemText}>{playlist.name}</Text>
                    <Text style={[styles.itemMeta, isInPlaylist && styles.removeMeta]}>{isInPlaylist ? 'Remove song' : playlist.isPublic ? 'Public' : 'Private'}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.message}>Create a playlist first, then come back here.</Text>
          )}
          <Pressable onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Panel>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    gap: 12,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontFamily: font.extra,
    fontSize: 22,
  },
  message: {
    color: colors.muted,
    fontFamily: font.regular,
  },
  item: {
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  itemText: {
    color: colors.text,
    fontFamily: font.bold,
  },
  removeItem: {
    borderColor: 'rgba(244, 63, 94, 0.38)',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  itemMeta: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
    marginTop: 4,
  },
  removeMeta: {
    color: '#fecdd3',
    fontFamily: font.bold,
  },
  close: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  closeText: {
    color: colors.cyan,
    fontFamily: font.bold,
  },
  scrollList: {
    maxHeight: 240,
    marginVertical: 4,
  },
  listContainer: {
    gap: 10,
  },
});

export default AddToPlaylistModal;
