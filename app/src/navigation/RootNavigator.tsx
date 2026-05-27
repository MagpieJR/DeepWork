import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Session } from '@supabase/supabase-js';
import NetInfo from '@react-native-community/netinfo';
import LoginScreen from '../screens/LoginScreen';
import MainNavigator from './MainNavigator';
import { supabase } from '../services/supabase';
import { runSync } from '../services/sync';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // ── Auth state listener ──────────────────────────────────────────────────

  useEffect(() => {
    // Check existing session on mount.
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthChecked(true);
    });

    // Subscribe to auth state changes (sign-in, sign-out, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Network reconnect → background sync ─────────────────────────────────

  useEffect(() => {
    if (!session) return;

    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        // Fire sync in the background; does not block UI.
        runSync().catch(console.warn);
      }
    });

    return () => unsub();
  }, [session]);

  // Don't render navigation until auth check completes (avoids flash).
  if (!authChecked) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
