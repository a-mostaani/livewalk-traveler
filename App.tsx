import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Button, colors } from './src/components/Primitives';
import { defaultRequest } from './src/data/mock';
import { useSession } from './src/hooks/useSession';
import { API_BASE } from './src/api';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { ConfirmedScreen } from './src/screens/ConfirmedScreen';
import { LiveWalkScreen } from './src/screens/LiveWalkScreen';
import { MatchingScreen } from './src/screens/MatchingScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { RequestScreen } from './src/screens/RequestScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { Screen, WalkRequest } from './src/types';

const screenOrder: Screen[] = ['onboarding', 'request', 'review', 'matching', 'confirmed', 'live', 'summary'];

const screenLabels: Record<Screen, string> = {
  onboarding: 'Start',
  request: 'Request',
  review: 'Review',
  matching: 'Match',
  confirmed: 'Booked',
  live: 'Live',
  summary: 'Summary',
};

function TravelerApp() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [request, setRequest] = useState<WalkRequest>(defaultRequest);
  const scrollRef = useRef<ScrollView>(null);
  const currentIndex = screenOrder.indexOf(screen);
  const isFirstScreen = currentIndex === 0;
  const isLastScreen = currentIndex === screenOrder.length - 1;

  const session = useSession({ enabled: Boolean(user), localRequest: request, currentScreen: screen, onAccepted: () => navigateTo('confirmed') });
  const remoteRequest = session.request;
  const messages = session.messages;
  const apiOnline = session.apiOnline;
  const apiNote = session.apiNote;
  const busy = session.busy;
  const guideHasStartedLive = session.guideHasStartedLive;

  const navigateTo = (nextScreen: Screen) => {
    if (nextScreen === 'live' && !guideHasStartedLive) return;
    setScreen(nextScreen);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  const goPrevious = () => {
    if (!isFirstScreen) navigateTo(screenOrder[currentIndex - 1]);
  };

  const goNext = () => {
    if (screen === 'confirmed' && !guideHasStartedLive) return;
    navigateTo(isLastScreen ? 'request' : screenOrder[currentIndex + 1]);
  };
  const nextDisabled = screen === 'confirmed' && !guideHasStartedLive;
  const nextLabel = nextDisabled ? 'Waiting for guide' : (isLastScreen ? 'New walk' : 'Next');
  const nextIcon = nextDisabled ? 'lock-closed' : (isLastScreen ? 'add-circle' : 'chevron-forward');

  const submitRequest = async () => {
    const submitted = await session.submitRequest();
    if (submitted) navigateTo('matching');
  };

  const joinLive = async () => {
    const joined = await session.joinLive();
    if (joined) navigateTo('live');
  };

  const sendTravelerMessage = async (text: string) => {
    await session.sendMessage(text);
  };

  const resetLocal = () => {
    session.reset();
    navigateTo('request');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <View style={styles.appShell}>
          <View style={styles.appHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go to Start page" hitSlop={10} onPress={() => navigateTo('onboarding')} style={({ pressed }) => [styles.logoMini, pressed && styles.pressed]}>
              <Ionicons name="navigate" size={16} color={colors.white} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>LiveWalk Traveler MVP</Text>
              <Text style={styles.headerSub}>Shared backend booking cycle</Text>
            </View>
            <View style={[styles.statusPill, apiOnline ? styles.statusPillOnline : styles.statusPillOffline]}>
              <View style={[styles.statusDot, apiOnline && styles.statusDotOnline]} />
              <Text style={styles.statusText}>{apiOnline ? 'Live' : 'Sync'}</Text>
            </View>
          </View>
          <Text style={styles.backendLine} numberOfLines={1}>{user ? `${user.name} • ${apiNote}` : apiNote} • {API_BASE.replace('https://', '')}</Text>
          {user ? <View style={styles.stepper}>
            {screenOrder.map((item, index) => {
              const active = item === screen;
              return (
                <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={`Open ${screenLabels[item]} step`} hitSlop={6} onPress={() => navigateTo(item)} style={({ pressed }) => [styles.stepItem, pressed && styles.stepItemPressed]}>
                  <View style={[styles.stepDot, index <= currentIndex && styles.stepDotActive]} />
                  <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>{screenLabels[item]}</Text>
                </Pressable>
              );
            })}
          </View> : null}
          <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator>
            {!user ? (
              <AuthScreen />
            ) : (
              <>
                {screen === 'onboarding' ? <OnboardingScreen onStart={() => navigateTo('request')} /> : null}
                {screen === 'request' ? <RequestScreen request={request} onChange={setRequest} onReview={() => navigateTo('review')} /> : null}
                {screen === 'review' ? <ReviewScreen request={request} estimate={remoteRequest?.estimate} onBack={() => navigateTo('request')} onFindGuide={submitRequest} busy={busy} /> : null}
                {screen === 'matching' ? <MatchingScreen request={request} remoteRequest={remoteRequest} onCheck={session.refresh} onReset={resetLocal} /> : null}
                {screen === 'confirmed' ? <ConfirmedScreen request={request} remoteRequest={remoteRequest} canJoinLive={guideHasStartedLive} onJoin={joinLive} /> : null}
                {screen === 'live' ? <LiveWalkScreen remoteRequest={remoteRequest} messages={messages} onSendMessage={sendTravelerMessage} onEnd={() => navigateTo('summary')} /> : null}
                {screen === 'summary' ? <SummaryScreen onNewWalk={resetLocal} /> : null}
              </>
            )}
          </ScrollView>
          {user ? <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
            <View style={styles.bottomNav}>
              <Button label="Previous" icon="chevron-back" variant="secondary" onPress={goPrevious} disabled={isFirstScreen} style={styles.navButton} />
              <Button label={nextLabel} icon={nextIcon} onPress={goNext} disabled={nextDisabled} style={styles.navButton} />
            </View>
          </SafeAreaView> : null}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  appShell: { flex: 1, backgroundColor: colors.cream },
  appHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 6 },
  logoMini: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.68 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  headerSub: { color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1 },
  statusPillOnline: { backgroundColor: '#EAF7F2', borderColor: '#BDE8DC' },
  statusPillOffline: { backgroundColor: '#FFF8EA', borderColor: '#F2DCA8' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
  statusDotOnline: { backgroundColor: colors.green },
  statusText: { color: colors.ink, fontWeight: '900', fontSize: 11 },
  backendLine: { color: colors.muted, fontSize: 11, fontWeight: '700', paddingHorizontal: 18, paddingBottom: 7 },
  stepper: { flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 8, gap: 3 },
  stepItem: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 12 },
  stepItemPressed: { backgroundColor: 'rgba(6,24,38,0.06)' },
  stepDot: { width: '82%', height: 4, borderRadius: 999, backgroundColor: '#E4DCCD' },
  stepDotActive: { backgroundColor: colors.ink },
  stepLabel: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  stepLabelActive: { color: colors.ink },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28 },
  bottomSafeArea: { backgroundColor: colors.cream },
  bottomNav: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: 'rgba(6,24,38,0.08)', backgroundColor: 'rgba(251,247,239,0.98)' },
  navButton: { flex: 1 },
});

export default function App() {
  return (
    <AuthProvider>
      <TravelerApp />
    </AuthProvider>
  );
}
