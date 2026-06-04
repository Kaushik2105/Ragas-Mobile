import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';

export const screenStyles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    paddingBottom: 250,
    paddingHorizontal: 18,
    paddingTop: 58,
  },
  section: {
    gap: 18,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: font.extra,
    fontSize: 21,
  },
  eyebrow: {
    color: colors.cyan,
    fontFamily: font.extra,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  text: {
    color: colors.text,
    fontFamily: font.regular,
  },
  muted: {
    color: colors.muted,
    fontFamily: font.regular,
  },
});
