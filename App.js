import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { Animated, Platform, StatusBar as RNStatusBar, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';
import GradientBackground from './src/components/common/GradientBackground';
import Loader from './src/components/common/Loader';
import useAuthStore from './src/store/authStore';
import usePlayerStore from './src/store/playerStore';
import { colors } from './src/theme/colors';

const navigationTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: 'transparent',
    primary: colors.cyan,
  },
};

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'ragas://', 'https://ragas-frontend.netlify.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          ResetPassword: 'reset-password',
        },
      },
    },
  },
};

export default function App() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const cleanup = usePlayerStore((state) => state.cleanup);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  const appOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hydrate();
    return () => cleanup();
  }, [cleanup, hydrate]);

  useEffect(() => {
    if (fontsLoaded) {
      Animated.timing(appOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [fontsLoaded, appOpacity]);

  if (!fontsLoaded) {
    return (
      <GradientBackground>
        <Loader label="Loading RAGAS" />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <StatusBar style="light" backgroundColor={colors.bg} translucent={true} />
      {Platform.OS === 'android' && (
        <View style={{ height: RNStatusBar.currentHeight, backgroundColor: colors.bg }} />
      )}
      <Animated.View style={{ flex: 1, opacity: appOpacity }}>
        <NavigationContainer theme={navigationTheme} linking={linking}>
          <AppNavigator />
        </NavigationContainer>
      </Animated.View>
      <Toast />
    </GradientBackground>
  );
}

