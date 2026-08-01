import { useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import AppLogo from '../../components/common/AppLogo';
import { PrimaryButton, GhostButton } from '../../components/common/Buttons';
import Panel from '../../components/common/Panel';
import TextInputField from '../../components/common/TextInputField';
import useAuthStore from '../../store/authStore';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import Footer from '../../components/common/Footer';
import { FontAwesome } from '@expo/vector-icons';

let GoogleSignin = null;
let googleSigninStatusCodes = null;

try {
  const googleSdk = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSdk.GoogleSignin;
  googleSigninStatusCodes = googleSdk.statusCodes;
  GoogleSignin.configure({
    webClientId: '621426543476-7lkvts60d3puk5q32qnp2ktscamvaant.apps.googleusercontent.com',
    offlineAccess: true,
  });
} catch (error) {
  console.warn('⚠️ Google Sign-In is not supported in Expo Go. Use a custom Dev Client or EAS Build.');
}

const LoginScreen = ({ navigation }) => {
  const { login, googleLogin, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    if (!GoogleSignin) {
      Toast.show({
        type: 'error',
        text1: 'Google Sign-in not supported in Expo Go',
        text2: 'Please use the EAS build APK to test Google Sign-in.',
      });
      return;
    }

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;

      if (!idToken) {
        throw new Error('No Google ID Token received');
      }

      const result = await googleLogin(idToken);
      if (result?.success) {
        Toast.show({ type: 'success', text1: 'Welcome back to RAGAS' });
      } else {
        Toast.show({ type: 'error', text1: result?.message || 'Google Sign-in failed' });
      }
    } catch (error) {
      if (error.code === googleSigninStatusCodes?.SIGN_IN_CANCELLED) {
        Toast.show({ type: 'info', text1: 'Sign-in cancelled' });
      } else if (error.code === googleSigninStatusCodes?.IN_PROGRESS) {
        Toast.show({ type: 'info', text1: 'Sign-in in progress' });
      } else {
        Toast.show({ type: 'error', text1: error.message || 'Google Sign-in failed' });
      }
    }
  };

  const submit = async () => {
    if (!email || password.length < 6) {
      Toast.show({ type: 'error', text1: 'Enter a valid email and password' });
      return;
    }
    const result = await login({ email, password });
    if (result?.success) {
      Toast.show({ type: 'success', text1: 'Welcome back to RAGAS' });
    } else {
      Toast.show({ type: 'error', text1: result?.message || 'Login failed' });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Panel style={styles.card}>
        <AppLogo />
        <Text style={styles.title}>Log in and press play.</Text>
        <Text style={styles.copy}>Your dark-purple listening room is waiting.</Text>
        <TextInputField label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInputField label="Password" placeholder="At least 6 characters" value={password} onChangeText={setPassword} secureTextEntry />
        <PrimaryButton disabled={isLoading} onPress={submit}>{isLoading ? 'Signing in...' : 'Sign in'}</PrimaryButton>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.line} />
        </View>

        <GhostButton disabled={isLoading} onPress={handleGoogleLogin} style={styles.googleBtn}>
          <View style={styles.googleBtnContent}>
            <FontAwesome name="google" size={18} color={colors.text} style={{ marginRight: 10 }} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </View>
        </GhostButton>

        <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.mutedLink}>Forgot your password?</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.switch}>New here? <Text style={styles.link}>Create an account</Text></Text>
        </Pressable>
      </Panel>
      <Footer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    gap: 16,
  },
  title: {
    color: colors.text,
    fontFamily: font.black,
    fontSize: 40,
    lineHeight: 40,
  },
  copy: {
    color: colors.muted,
    fontFamily: font.regular,
    lineHeight: 21,
  },
  mutedLink: {
    color: colors.muted,
    fontFamily: font.semi,
    textAlign: 'center',
  },
  switch: {
    color: colors.muted,
    fontFamily: font.regular,
    textAlign: 'center',
  },
  link: {
    color: colors.cyan,
    fontFamily: font.extra,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.muted,
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: font.bold,
  },
  googleBtn: {
    width: '100%',
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: {
    color: colors.text,
    fontFamily: font.bold,
    fontSize: 15,
  },
});

export default LoginScreen;
