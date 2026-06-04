import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrating: true,
  isLoading: false,
  error: null,

  hydrate: async () => {
    try {
      const [token, userJson] = await AsyncStorage.multiGet(['accessToken', 'user']);
      const accessToken = token?.[1];
      const storedUser = userJson?.[1] ? JSON.parse(userJson[1]) : null;
      set({ user: storedUser, isAuthenticated: !!accessToken, isHydrating: false });
    } catch {
      set({ user: null, isAuthenticated: false, isHydrating: false });
    }
  },

  requestRegistrationOtp: async ({ name, email }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register/request-otp', { name, email });
      set({ isLoading: false });
      return { success: true, data: data.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Could not send OTP';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  verifyRegistrationOtp: async ({ email, otp }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register/verify-otp', { email, otp });
      set({ isLoading: false });
      return { success: true, verificationToken: data.data.verificationToken };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'OTP verification failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  register: async ({ email, password, verificationToken }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { email, password, verificationToken });
      if (data.success) {
        await AsyncStorage.multiSet([
          ['accessToken', data.data.accessToken],
          ['user', JSON.stringify(data.data.user)],
        ]);
        await AsyncStorage.removeItem('hasSeenWelcome');
        set({ user: data.data.user, isAuthenticated: true, isLoading: false });
        return { success: true, user: data.data.user };
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
    set({ isLoading: false });
    return { success: false, message: 'Registration failed' };
  },

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.success) {
        await AsyncStorage.multiSet([
          ['accessToken', data.data.accessToken],
          ['user', JSON.stringify(data.data.user)],
        ]);
        await AsyncStorage.removeItem('hasSeenWelcome');
        set({ user: data.data.user, isAuthenticated: true, isLoading: false });
        return { success: true };
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
    set({ isLoading: false });
    return { success: false, message: 'Login failed' };
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // The token is discarded either way.
    }
    await AsyncStorage.multiRemove(['accessToken', 'user']);
    set({ user: null, isAuthenticated: false });
  },

  updateUser: async (userData) => {
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    set({ user: userData });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
