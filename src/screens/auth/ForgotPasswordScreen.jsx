import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import AppLogo from '../../components/common/AppLogo';
import { PrimaryButton } from '../../components/common/Buttons';
import Panel from '../../components/common/Panel';
import TextInputField from '../../components/common/TextInputField';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import { sendResetEmail, WEB_APP_URL } from '../../utils/email';
import Footer from '../../components/common/Footer';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      const resetData = response.data?.data;
      if (resetData?.token) {
        const resetLink = `${WEB_APP_URL}/reset-password?token=${resetData.token}&source=app`;
        await sendResetEmail({
          email: resetData.email || email,
          name: resetData.name,
          resetLink,
        });
      }
      Toast.show({ type: 'success', text1: 'If that email exists, a reset email has been sent.' });
    } catch (error) {
      console.error('Reset email failure:', error);
      Toast.show({ type: 'error', text1: error.response?.data?.message || error.message || 'Failed to request reset' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Panel style={styles.card}>
        <AppLogo />
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.copy}>Enter your account email to request a reset.</Text>
        <TextInputField label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <PrimaryButton disabled={loading} onPress={submit}>{loading ? 'Sending...' : 'Send reset link'}</PrimaryButton>
        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Remembered it? Sign in</Text>
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
  },
  link: {
    color: colors.cyan,
    fontFamily: font.extra,
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;
