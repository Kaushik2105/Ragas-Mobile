import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';

const TextInputField = ({ label, error, style, ...props }) => (
  <View style={[styles.wrap, style]}>
    {label ? <Text style={styles.label}>{label}</Text> : null}
    <TextInput
      placeholderTextColor="rgba(156, 163, 175, 0.72)"
      selectionColor={colors.cyan}
      style={styles.input}
      {...props}
    />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    gap: 7,
  },
  label: {
    color: colors.muted,
    fontFamily: font.semi,
    fontSize: 13,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.text,
    fontFamily: font.regular,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  error: {
    color: '#fda4af',
    fontFamily: font.regular,
    fontSize: 12,
  },
});

export default TextInputField;
