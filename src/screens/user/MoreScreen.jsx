import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import PageHeader from '../../components/common/PageHeader';
import Panel from '../../components/common/Panel';
import useAuthStore from '../../store/authStore';
import { colors } from '../../theme/colors';
import { font } from '../../theme/typography';
import { screenStyles } from './screenStyles';
import Footer from '../../components/common/Footer';

const MenuItem = ({ icon, title, description, onPress, danger }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.item,
      pressed && styles.itemPressed,
      danger && styles.itemDanger,
    ]}
  >
    <View style={[styles.iconContainer, danger && styles.iconContainerDanger]}>
      <Feather name={icon} size={20} color={danger ? colors.pink : colors.cyan} />
    </View>
    <View style={styles.content}>
      <Text style={[styles.title, danger && styles.titleDanger]}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
    <Feather
      name="chevron-right"
      size={18}
      color={danger ? 'rgba(244, 63, 94, 0.4)' : 'rgba(34, 211, 238, 0.4)'}
    />
  </Pressable>
);

const MoreScreen = () => {
  const navigation = useNavigation();
  const logout = useAuthStore((state) => state.logout);

  return (
    <ScrollView
      contentContainerStyle={[screenStyles.screen, screenStyles.section]}
      showsVerticalScrollIndicator={false}
    >
      <PageHeader
        eyebrow="More features"
        title="Explore Ragas"
        description="Access community reviews, manage your libraries, or refine your profile details."
      />

      <Panel style={styles.container}>
        <MenuItem
          icon="message-square"
          title="Community Feedback"
          description="Read track notes shared by others and leave your own reactions."
          onPress={() => navigation.navigate('Feedback')}
        />
        <MenuItem
          icon="list"
          title="Playlists"
          description="Organize your custom song collections and listening lists."
          onPress={() => navigation.navigate('Playlists')}
        />
        <MenuItem
          icon="user"
          title="Profile Settings"
          description="Tune your email, profile picture, name, and visual layout."
          onPress={() => navigation.navigate('Profile')}
        />
        <View style={styles.divider} />
        <MenuItem
          icon="log-out"
          title="Log Out"
          description="Sign out from your active listener session on this device."
          danger
          onPress={logout}
        />
      </Panel>

      <Footer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  itemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemDanger: {
    // Subtle background highlight on press/hold could be added, but styling stays clean
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconContainerDanger: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: font.bold,
    fontSize: 16,
    color: colors.text,
  },
  titleDanger: {
    color: colors.pink,
  },
  description: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
    marginHorizontal: 12,
  },
});

export default MoreScreen;
