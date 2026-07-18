import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Header, colors } from '../components/Primitives';
import { QaBuildBadge } from '../components/QaBuildBadge';
import { useAuth } from '../auth/AuthContext';

type Mode = 'register' | 'login';

export function AuthScreen() {
  const { busy, error, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('traveler@livewalk.test');
  const [password, setPassword] = useState('secret123');
  const isRegister = mode === 'register';
  const [localError, setLocalError] = useState('');
  const shownError = localError || error;

  const useDemoTraveler = () => {
    setMode('login');
    setName('Sofia Ramirez');
    setEmail('demo.traveler@livewalk.test');
    setPassword('LiveWalkDemo1!');
    setLocalError('');
  };

  const submit = () => {
    const displayName = name.trim();
    if (!displayName) {
      setLocalError('Enter the display name that should appear in the live walk.');
      return;
    }
    setLocalError('');
    return mode === 'register' ? register({ name: displayName, email, password }) : login({ name: displayName, email, password });
  };

  return (
    <View>
      <Header
        kicker="Account"
        title={isRegister ? 'Create your Traveler account.' : 'Log back in.'}
        body="Use the display name that should appear in requests, dashboards, and live sessions."
      />
      <QaBuildBadge />
      <Card style={styles.card}>
        <Field label={isRegister ? 'Name' : 'Display name'} value={name} onChangeText={setName} autoCapitalize="words" placeholder="Ash Most" />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        {shownError ? <View style={styles.errorBox}><Text style={styles.error}>{shownError}</Text></View> : null}
        <Button label="Use Demo Traveler" icon="sparkles" variant="secondary" onPress={useDemoTraveler} disabled={busy} style={styles.demo} />
        <Button label={busy ? 'Working…' : isRegister ? 'Create account' : 'Log in'} icon={isRegister ? 'person-add' : 'log-in'} onPress={submit} disabled={busy} style={styles.primary} />
        <Button
          label={isRegister ? 'I already have an account' : 'Create a new account'}
          variant="ghost"
          onPress={() => setMode(isRegister ? 'login' : 'register')}
          style={styles.secondary}
        />
      </Card>
      <Text style={styles.note}>MVP note: login stays active after closing and reopening the app. The display name is refreshed on login for this prototype.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 2 },
  demo: { marginTop: 2 },
  primary: { marginTop: 8 },
  secondary: { marginTop: 8 },
  errorBox: { backgroundColor: colors.surfaceDanger, borderColor: colors.danger, borderRadius: 14, borderWidth: 1, marginVertical: 8, padding: 12 },
  error: { color: colors.danger, fontWeight: '800' },
  note: { color: colors.textSecondary, fontWeight: '700', lineHeight: 20, marginTop: 14 },
});
