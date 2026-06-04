import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';

const Loader = ({ label = 'Loading' }) => (
  <View style={styles.wrap}>
    <ActivityIndicator color={colors.cyan} size="large" />
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    minHeight: 260,
  },
  label: {
    color: colors.muted,
    fontFamily: font.semi,
  },
});

export default Loader;
