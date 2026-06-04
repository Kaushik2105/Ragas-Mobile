import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import Panel from './Panel';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';

const EmptyState = ({ title, message, icon = 'music' }) => (
  <Panel style={styles.panel}>
    <Feather name={icon} size={30} color={colors.cyan} />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </Panel>
);

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    minHeight: 220,
  },
  title: {
    color: colors.text,
    fontFamily: font.extra,
    fontSize: 20,
    textAlign: 'center',
  },
  message: {
    color: colors.muted,
    fontFamily: font.regular,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default EmptyState;
