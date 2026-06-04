import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

const GradientBackground = ({ children }) => (
  <SafeAreaProvider>
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bg, colors.bg2, colors.bg3]}
        start={{ x: 0.1, y: 0.05 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.glow, styles.purpleGlow]} />
      <View style={[styles.glow, styles.cyanGlow]} />
      {children}
    </View>
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.28,
  },
  purpleGlow: {
    left: -110,
    top: -70,
    backgroundColor: colors.accent,
  },
  cyanGlow: {
    right: -120,
    top: 28,
    backgroundColor: colors.cyan,
    opacity: 0.18,
  },
});

export default GradientBackground;
