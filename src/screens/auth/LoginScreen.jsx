import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import AppLogo from '../../components/common/AppLogo';
import { PrimaryButton } from '../../components/common/Buttons';
import Panel from '../../components/common/Panel';
import TextInputField from '../../components/common/TextInputField';
import useAuthStore from '../../store/authStore';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import Footer from '../../components/common/Footer';

const LoginScreen = ({ navigation }) => {
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
});

export default LoginScreen;
