import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import Loader from '../components/common/Loader';
import WelcomeAnimation from '../components/layout/WelcomeAnimation';
import PlayerBar from '../components/player/PlayerBar';
import useAuthStore from '../store/authStore';
import { colors } from '../theme/colors';
import { font } from '../theme/typography';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import FavoritesScreen from '../screens/user/FavoritesScreen';
import HomeScreen from '../screens/user/HomeScreen';
import PlaylistsScreen from '../screens/user/PlaylistsScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import SearchScreen from '../screens/user/SearchScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcon = (name) => ({ color, size }) => <Feather name={name} color={color} size={size} />;

const MainTabs = () => (
  <View style={styles.main}>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon('home') }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: tabIcon('search') }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ tabBarIcon: tabIcon('heart') }} />
      <Tab.Screen name="Playlists" component={PlaylistsScreen} options={{ tabBarIcon: tabIcon('list') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('user') }} />
    </Tab.Navigator>
    <PlayerBar />
    <WelcomeAnimation />
  </View>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, isHydrating } = useAuthStore();

  if (isHydrating) return <Loader label="Restoring your session" />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: 'rgba(6, 8, 23, 0.94)',
    borderColor: colors.border,
    borderTopWidth: 1,
    height: 78,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: font.bold,
    fontSize: 11,
  },
});

export default AppNavigator;
