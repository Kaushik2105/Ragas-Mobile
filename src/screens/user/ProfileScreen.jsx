import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import api from '../../api/axios';
import { GhostButton, PrimaryButton } from '../../components/common/Buttons';
import Loader from '../../components/common/Loader';
import PageHeader from '../../components/common/PageHeader';
import Panel from '../../components/common/Panel';
import TextInputField from '../../components/common/TextInputField';
import useAuthStore from '../../store/authStore';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import { assetUrl, initials, unwrap } from '../../utils/music';
import { screenStyles } from './screenStyles';
import Footer from '../../components/common/Footer';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useAuthStore();
  const [profile, setProfile] = useState(user);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/me');
      const data = unwrap(response);
      setProfile(data);
      setName(data.name || '');
      updateUser(data);
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not load profile' });
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await api.put('/users/me', { name });
      const data = unwrap(response);
      setProfile(data);
      updateUser(data);
      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not update profile' });
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: 'Photo library permission is required' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.86,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('avatar', {
      uri: asset.uri,
      name: asset.fileName || 'avatar.jpg',
      type: asset.mimeType || 'image/jpeg',
    });

    try {
      const response = await api.put('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = unwrap(response);
      const nextProfile = { ...profile, ...data };
      setProfile(nextProfile);
      updateUser(nextProfile);
      Toast.show({ type: 'success', text1: 'Avatar updated' });
    } catch (error) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Could not upload avatar' });
    }
  };

  if (loading) return <Loader label="Loading profile" />;

  return (
    <ScrollView contentContainerStyle={[screenStyles.screen, screenStyles.section]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
        <Feather name="arrow-left" size={16} color={colors.cyan} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <PageHeader eyebrow="Profile" title="Tune your identity" description="Keep your listener profile current." />
      <Panel style={styles.card}>
        <View style={styles.avatar}>
          {profile?.profilePic ? (
            <Image source={{ uri: assetUrl(profile.profilePic) }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials(profile?.name)}</Text>
          )}
          <Pressable onPress={uploadAvatar} style={styles.camera}>
            <Feather name="camera" size={18} color={colors.dark} />
          </Pressable>
        </View>
        <TextInputField label="Name" value={name} onChangeText={setName} />
        <TextInputField label="Email" value={profile?.email || ''} editable={false} />
        <TextInputField label="Role" value={profile?.role || 'user'} editable={false} />
        <PrimaryButton disabled={saving} onPress={saveProfile}>{saving ? 'Saving...' : 'Save profile'}</PrimaryButton>
        <GhostButton danger onPress={logout}>
          <Text style={styles.logout}>Log out</Text>
        </GhostButton>
      </Panel>
      <Footer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  avatar: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.28)',
    borderRadius: 36,
    height: 190,
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
    width: 190,
  },
  avatarImage: {
    height: '100%',
    resizeMode: 'cover',
    width: '100%',
  },
  avatarText: {
    color: colors.text,
    fontFamily: font.black,
    fontSize: 52,
  },
  camera: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: 23,
    bottom: 12,
    height: 46,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    width: 46,
  },
  logout: {
    color: '#fecdd3',
    fontFamily: font.extra,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: -8,
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.cyan,
    fontFamily: font.bold,
    fontSize: 14,
  },
});

export default ProfileScreen;
