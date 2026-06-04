import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';

const Footer = () => (
  <View style={styles.container}>
    <Text style={styles.text}>{'\u00a9 2026 RAGAS. Made with \u2764\ufe0f by Kaushik.'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    borderTopWidth: 1,
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 28,
    width: '100%',
  },
  text: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 12,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
});

export default Footer;
