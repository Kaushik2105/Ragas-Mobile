import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import AppLogo from '../../components/common/AppLogo';
import { GhostButton, PrimaryButton } from '../../components/common/Buttons';
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

const RegisterScreen = ({ navigation }) => {
  const {
    requestRegistrationOtp,
    verifyRegistrationOtp,
    register,
    googleLogin,
    isLoading,
  } = useAuthStore();

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
        Toast.show({ type: 'success', text1: 'Welcome to RAGAS!' });
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
  const [step, setStep] = useState('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  const requestOtp = async () => {
    if (name.trim().length < 2 || !email.trim()) {
      Toast.show({ type: 'error', text1: 'Name and email are required' });
      return;
    }

    const result = await requestRegistrationOtp({ name: name.trim(), email: email.trim() });
    if (result?.success) {
      setStep('otp');
      Toast.show({ type: 'success', text1: 'OTP sent to your email.' });
      return;
    }

    Toast.show({ type: 'error', text1: result?.message || 'Could not send OTP' });
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      Toast.show({ type: 'error', text1: 'Enter the 6-digit OTP' });
      return;
    }

    const result = await verifyRegistrationOtp({ email: email.trim(), otp: otp.trim() });
    if (result?.success) {
      setVerificationToken(result.verificationToken);
      setStep('password');
      Toast.show({ type: 'success', text1: 'Email verified.' });
      return;
    }

    Toast.show({ type: 'error', text1: result?.message || 'OTP verification failed' });
  };

  const submit = async () => {
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }

    const result = await register({ email: email.trim(), password, verificationToken });
    Toast.show({
      type: result?.success ? 'success' : 'error',
      text1: result?.success ? 'Account created. Welcome to RAGAS!' : result?.message || 'Registration failed',
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Panel style={styles.card}>
        <AppLogo />
        <Text style={styles.title}>Start your collection.</Text>
        <Text style={styles.copy}>Create a listener account and build playlists, favorites, and feedback.</Text>
        <TextInputField label="Name" placeholder="Your name" value={name} onChangeText={setName} editable={step === 'details'} />
        <TextInputField label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={step === 'details'} />
        {step === 'details' ? (
          <>
            <PrimaryButton disabled={isLoading} onPress={requestOtp}>{isLoading ? 'Sending...' : 'Send OTP'}</PrimaryButton>
            
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
          </>
        ) : null}
        {step === 'otp' ? (
          <>
            <TextInputField
              label="OTP"
              placeholder="6-digit code"
              value={otp}
              onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />
            <PrimaryButton disabled={isLoading} onPress={verifyOtp}>{isLoading ? 'Verifying...' : 'Verify email'}</PrimaryButton>
            <GhostButton disabled={isLoading} onPress={requestOtp}>Resend OTP</GhostButton>
          </>
        ) : null}
        {step === 'password' ? (
          <>
            <TextInputField label="Password" placeholder="At least 6 characters" value={password} onChangeText={setPassword} secureTextEntry />
            <PrimaryButton disabled={isLoading} onPress={submit}>{isLoading ? 'Creating...' : 'Create account'}</PrimaryButton>
          </>
        ) : null}
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switch}>Already listening? <Text style={styles.link}>Sign in</Text></Text>
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
    fontSize: 38,
    lineHeight: 39,
  },
  copy: {
    color: colors.muted,
    fontFamily: font.regular,
    lineHeight: 21,
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

export default RegisterScreen;
