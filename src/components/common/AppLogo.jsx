import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';

const logo = require('../../../assets/ragas-logo.png');

const AppLogo = ({ large = false }) => (
  <View style={styles.row}>
    <View style={[styles.mark, large && styles.largeMark]}>
      <Image source={logo} style={styles.image} />
    </View>
    <Text style={[styles.wordmark, large && styles.largeWordmark]}>RAGAS</Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.96)',
    borderRadius: 18,
    height: 50,
    justifyContent: 'center',
    padding: 4,
    width: 50,
  },
  largeMark: {
    borderRadius: 30,
    height: 112,
    width: 112,
  },
  image: {
    borderRadius: 14,
    height: '100%',
    resizeMode: 'contain',
    width: '100%',
  },
  wordmark: {
    color: colors.text,
    fontFamily: font.extra,
    fontSize: 20,
  },
  largeWordmark: {
    fontSize: 28,
  },
});

export default AppLogo;
