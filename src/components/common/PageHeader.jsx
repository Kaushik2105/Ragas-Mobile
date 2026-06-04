import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';

const PageHeader = ({ eyebrow, title, description }) => (
  <View style={styles.wrap}>
    <Text style={styles.eyebrow}>{eyebrow}</Text>
    <Text style={styles.title}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  eyebrow: {
    color: colors.cyan,
    fontFamily: font.extra,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: font.black,
    fontSize: 42,
    lineHeight: 43,
  },
  description: {
    color: colors.muted,
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 22,
  },
});

export default PageHeader;
