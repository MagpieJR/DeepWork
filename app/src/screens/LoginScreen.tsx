import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { signInWithEmail, signUpWithEmail, supabase } from '../services/supabase';
import { C, T, MONO, BTN_PRIMARY } from '../theme';

type AuthMode = 'signin' | 'signup';

export default function LoginScreen() {
  const [mode, setMode]       = useState<AuthMode>('signin');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleEmailAuth = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('請輸入電子郵件和密碼。');
      return;
    }
    setLoading(true);
    try {
      const { error: authError } =
        mode === 'signin'
          ? await signInWithEmail(email.trim(), password)
          : await signUpWithEmail(email.trim(), password);
      if (authError) setError(authError.message);
    } catch (e: any) {
      setError(e.message ?? '發生錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({ provider });
      if (authError) setError(authError.message);
    } catch (e: any) {
      setError(e.message ?? '發生錯誤，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Wordmark */}
        <Text style={styles.wordmark}>DeepWork</Text>
        <Text style={styles.subtitle}>專注更深，每一天</Text>

        {/* OAuth */}
        <TouchableOpacity
          style={styles.oauthBtn}
          onPress={() => handleOAuth('google')}
          disabled={loading}
        >
          <Text style={styles.oauthBtnText}>以 Google 帳號登入</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.oauthBtn}
          onPress={() => handleOAuth('apple')}
          disabled={loading}
        >
          <Text style={styles.oauthBtnText}>以 Apple 帳號登入</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.orRow}>
          <View style={styles.hairline} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.hairline} />
        </View>

        {/* Email input — underline only */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>電子郵件</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholderTextColor={C.mutedSoft}
            placeholder="your@email.com"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>密碼</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPass}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholderTextColor={C.mutedSoft}
            placeholder="••••••••"
          />
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {/* Primary CTA */}
        <TouchableOpacity
          style={[BTN_PRIMARY, styles.primaryBtn, loading && styles.btnDisabled]}
          onPress={handleEmailAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={C.onDark} />
          ) : (
            <Text style={styles.primaryBtnText}>
              {mode === 'signin' ? '登入' : '建立帳號'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Mode switch */}
        <TouchableOpacity
          style={styles.switchMode}
          onPress={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
        >
          <Text style={styles.switchText}>
            {mode === 'signin'
              ? "沒有帳號？  註冊"
              : "已有帳號？  登入"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.canvas },

  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 80,
  },

  wordmark: {
    ...T.wordmark,
    fontSize: 22,
    letterSpacing: 10,
    textAlign: 'center',
    marginBottom: 12,
  },

  subtitle: {
    ...T.bodySM,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 48,
  },

  hairline: {
    flex: 1,
    height: 1,
    backgroundColor: C.hairline,
  },

  // OAuth buttons — ghost style
  oauthBtn: {
    borderWidth: 1,
    borderColor: C.hairlineStrong,
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  oauthBtnText: {
    ...T.button,
    color: C.body,
  },

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 28,
  },
  orText: {
    ...T.caption,
    color: C.mutedSoft,
  },

  // Inputs
  inputGroup: { marginBottom: 24 },
  inputLabel: {
    ...T.caption,
    marginBottom: 8,
  },
  input: {
    ...T.bodyMD,
    borderBottomWidth: 1,
    borderBottomColor: C.hairlineStrong,
    paddingVertical: 10,
    color: C.onDark,
  },

  errorText: {
    ...T.caption,
    color: C.danger,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: -8,
  },

  primaryBtn: {
    marginTop: 8,
    marginBottom: 24,
  },
  primaryBtnText: { ...T.button },
  btnDisabled: { opacity: 0.4 },

  switchMode: { alignItems: 'center' },
  switchText: {
    ...T.caption,
    color: C.mutedSoft,
    letterSpacing: 1.5,
  },
});
