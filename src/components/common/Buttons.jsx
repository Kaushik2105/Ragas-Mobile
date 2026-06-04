import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';

export const PrimaryButton = ({ children, onPress, disabled, style }) => (
  <Pressable disabled={disabled} onPress={onPress} style={[styles.buttonWrap, disabled && styles.disabled, style]}>
    <LinearGradient colors={[colors.accent, colors.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
      <Text style={styles.primaryText}>{children}</Text>
    </LinearGradient>
  </Pressable>
);

export const GhostButton = ({ children, onPress, active, danger, disabled, style }) => (
  <Pressable
    disabled={disabled}
    onPress={onPress}
    style={[
      styles.ghost,
      active && styles.active,
      danger && styles.danger,
      disabled && styles.disabled,
      style,
    ]}
  >
    {typeof children === 'string' ? <Text style={styles.ghostText}>{children}</Text> : children}
  </Pressable>
);

const styles = StyleSheet.create({
  buttonWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.62,
  },
  primary: {
    alignItems: 'center',
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryText: {
    color: colors.white,
    fontFamily: font.extra,
    fontSize: 15,
  },
  ghost: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.68)',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14,
  },
  active: {
    borderColor: colors.borderActive,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
  },
  danger: {
    borderColor: 'rgba(244, 63, 94, 0.38)',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  ghostText: {
    color: colors.text,
    fontFamily: font.bold,
  },
});
