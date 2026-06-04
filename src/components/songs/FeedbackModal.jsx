import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import Panel from '../common/Panel';
import TextInputField from '../common/TextInputField';
import { PrimaryButton } from '../common/Buttons';

const FeedbackModal = ({ song, onClose }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!song) return;
    setLoading(true);
    try {
      await api.post(`/feedback/song/${song.id}`, { rating, comment });
      Toast.show({ type: 'success', text1: 'Feedback submitted' });
      setComment('');
      setRating(5);
      onClose?.();
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not submit feedback' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent visible={!!song} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Panel style={styles.modal}>
          <Text style={styles.title}>Rate this track</Text>
          <Text style={styles.message}>{song?.title}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)} hitSlop={10}>
                <Text style={[styles.star, value <= rating && styles.starActive]}>★</Text>
              </Pressable>
            ))}
          </View>
          <TextInputField
            multiline
            numberOfLines={4}
            placeholder="What did this song make you feel?"
            value={comment}
            onChangeText={setComment}
            style={styles.comment}
          />
          <PrimaryButton disabled={loading} onPress={submit}>{loading ? 'Sending...' : 'Submit feedback'}</PrimaryButton>
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
    gap: 13,
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
  stars: {
    flexDirection: 'row',
    gap: 10,
  },
  star: {
    color: 'rgba(156, 163, 175, 0.45)',
    fontSize: 32,
  },
  starActive: {
    color: '#facc15',
  },
  comment: {
    minHeight: 110,
  },
  close: {
    alignItems: 'center',
    minHeight: 38,
    justifyContent: 'center',
  },
  closeText: {
    color: colors.cyan,
    fontFamily: font.bold,
  },
});

export default FeedbackModal;
