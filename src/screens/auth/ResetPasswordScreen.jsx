import { useState, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import AppLogo from '../../components/common/AppLogo';
import { PrimaryButton } from '../../components/common/Buttons';
import Panel from '../../components/common/Panel';
import TextInputField from '../../components/common/TextInputField';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import Footer from '../../components/common/Footer';

const ResetPasswordScreen = ({ route, navigation }) => {
  const token = route.params?.token;
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      Toast.show({
        type: 'error',
        text1: 'Reset token is missing or invalid.',
        text2: 'Please request a new reset link.',
      });
    }
  }, [token]);

  const submit = async () => {
    if (!token) {
      Toast.show({ type: 'error', text1: 'Missing reset token. Please request a new one.' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      if (response.data?.success) {
        Toast.show({ type: 'success', text1: 'Password reset successfully!' });
        navigation.navigate('Login');
      } else {
        Toast.show({ type: 'error', text1: response.data?.message || 'Failed to reset password' });
      }
    } catch (error) {
      console.error('Password reset failure:', error);
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || error.message || 'Failed to reset password',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">
      <Panel style={styles.card}>
        <AppLogo />
        <Text style={styles.title}>Choose a new password</Text>
        <Text style={styles.copy}>Make sure it's strong and unique.</Text>

        <TextInputField
          label="New Password"
          placeholder="At least 6 characters"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          disabled={loading || !token}
        />

        <PrimaryButton disabled={loading || !token} onPress={submit}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </PrimaryButton>

        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switch}>
            Back to <Text style={styles.link}>Sign in</Text>
          </Text>
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
});

export default ResetPasswordScreen;
