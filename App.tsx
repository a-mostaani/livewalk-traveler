import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Button, colors } from './src/components/Primitives';
import { defaultRequest } from './src/data/mock';
import { stageLabels, stageOrder, stageState, canOpenStage } from './src/flow';
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
import { hasRouteCoordinates, Screen, WalkRequest } from './src/types';

function TravelerApp() {
  const { user, busy: authBusy } = useAuth();
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [request, setRequest] = useState<WalkRequest>(defaultRequest);
  const scrollRef = useRef<ScrollView>(null);
  const currentIndex = stageOrder.indexOf(screen);
  const isFirstScreen = currentIndex === 0;
  const isLastScreen = currentIndex === stageOrder.length - 1;

  const session = useSession({ enabled: Boolean(user), localRequest: request, currentScreen: screen, onAccepted: () => navigateTo('confirmed') });
  const remoteRequest = session.request;
  const messages = session.messages;
  const liveSession = session.liveSession;
  const apiOnline = session.apiOnline;
  const apiNote = session.apiNote;
  const busy = session.busy;
  const guideHasStartedLive = session.guideHasStartedLive;
  const sessionEnded = session.sessionEnded;
  const walkHistoryState = session.walkHistoryState;

  const navigateTo = (nextScreen: Screen) => {
    if (!canOpenStage(nextScreen, guideHasStartedLive)) return;
    setScreen(nextScreen);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  useEffect(() => {
    if (sessionEnded && screen === 'live') {
      setScreen('summary');
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
    }
  }, [screen, sessionEnded]);

  const goPrevious = () => {
    if (!isFirstScreen) navigateTo(stageOrder[currentIndex - 1]);
  };

  const goNext = () => {
    if (screen === 'confirmed' && !guideHasStartedLive) return;
    if (screen === 'request') {
      openReview();
      return;
    }
    navigateTo(isLastScreen ? 'request' : stageOrder[currentIndex + 1]);
  };
  const nextDisabled = screen === 'confirmed' && !guideHasStartedLive;
  const nextLabel = nextDisabled ? 'Waiting for guide' : (isLastScreen ? 'New walk' : 'Next');
  const nextIcon = nextDisabled ? 'lock-closed' : (isLastScreen ? 'add-circle' : 'chevron-forward');

  const submitRequest = async () => {
    const submitted = await session.submitRequest();
    if (submitted) navigateTo('matching');
  };

  const openReview = () => {
    if (!hasRouteCoordinates(request)) return;
    navigateTo('review');
  };

  const updateRequest = (next: WalkRequest) => {
    setRequest(next);
    session.clearEstimate();
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
              <Ionicons name="navigate" size={16} color={colors.onDark} />
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
          {user ? <StageHeader currentIndex={currentIndex} screen={screen} /> : null}
          <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator>
            {authBusy ? (
              <View style={styles.authGate}>
                <Text style={styles.authGateKicker}>Account</Text>
                <Text style={styles.authGateTitle}>Restoring your session…</Text>
                <Text style={styles.authGateText}>Checking saved login before showing the app.</Text>
              </View>
            ) : !user ? (
              <AuthScreen />
            ) : (
              <>
                {screen === 'onboarding' ? <OnboardingScreen historyState={walkHistoryState} onStart={() => navigateTo('request')} /> : null}
                {screen === 'request' ? <RequestScreen request={request} onChange={updateRequest} onReview={openReview} /> : null}
                {screen === 'review' ? <ReviewScreen request={request} estimate={session.estimate} estimateBusy={session.estimateBusy} estimateError={session.estimateError} onBack={() => navigateTo('request')} onFindGuide={submitRequest} onRetryEstimate={session.quoteRequest} busy={busy} /> : null}
                {screen === 'matching' ? <MatchingScreen request={request} remoteRequest={remoteRequest} onCheck={session.refresh} onReset={resetLocal} /> : null}
                {screen === 'confirmed' ? <ConfirmedScreen request={request} remoteRequest={remoteRequest} canJoinLive={guideHasStartedLive} onJoin={joinLive} /> : null}
                {screen === 'live' ? <LiveWalkScreen remoteRequest={remoteRequest} liveSession={liveSession} messages={messages} onSendMessage={sendTravelerMessage} onEnd={session.endLive} /> : null}
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

function StageHeader({ currentIndex, screen }: { currentIndex: number; screen: Screen }) {
  const currentLabel = stageLabels[screen];
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Booking progress"
      accessibilityValue={{ min: 1, max: stageOrder.length, now: currentIndex + 1, text: `Stage ${currentIndex + 1} of ${stageOrder.length}: ${currentLabel}` }}
      style={styles.stageHeader}
    >
      <View style={styles.stageHeaderCopy}>
        <Text style={styles.stageEyebrow}>Booking progress</Text>
        <Text style={styles.stageSummary}>Stage {currentIndex + 1} of {stageOrder.length} · {currentLabel}</Text>
      </View>
      <View accessible={false} pointerEvents="none" style={styles.stageTrack}>
        {stageOrder.map((item, index) => {
          const state = stageState(index, currentIndex);
          const complete = state === 'complete';
          const current = state === 'current';
          return (
            <React.Fragment key={item}>
              <View style={styles.stageItem}>
                <View style={[styles.stageMarker, complete && styles.stageMarkerComplete, current && styles.stageMarkerCurrent]}>
                  {complete ? <Ionicons name="checkmark" size={14} color={colors.onAction} /> : <Text style={[styles.stageNumber, (complete || current) && styles.stageNumberCurrent]}>{index + 1}</Text>}
                </View>
                <Text style={[styles.stageLabel, current && styles.stageLabelCurrent, complete && styles.stageLabelComplete]} numberOfLines={2}>{stageLabels[item]}</Text>
              </View>
              {index < stageOrder.length - 1 ? <View style={[styles.stageConnector, complete && styles.stageConnectorComplete]} /> : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  appShell: { flex: 1, backgroundColor: colors.background },
  authGate: { backgroundColor: colors.surface, borderRadius: 28, borderWidth: 1, borderColor: colors.border, padding: 24, gap: 8 },
  authGateKicker: { color: colors.accentWarm, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  authGateTitle: { color: colors.textPrimary, fontSize: 26, fontWeight: '900', letterSpacing: -0.7 },
  authGateText: { color: colors.textSecondary, fontWeight: '700', lineHeight: 20 },
  appHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 6 },
  logoMini: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.textPrimary, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.78 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerTitle: { color: colors.textPrimary, fontWeight: '900', fontSize: 16 },
  headerSub: { color: colors.textSecondary, fontWeight: '700', fontSize: 12, marginTop: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: colors.border },
  statusPillOnline: { backgroundColor: colors.surfaceSuccess },
  statusPillOffline: { backgroundColor: colors.surfaceWarning },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentWarm },
  statusDotOnline: { backgroundColor: colors.success },
  statusText: { color: colors.textPrimary, fontWeight: '900', fontSize: 11 },
  backendLine: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', paddingHorizontal: 18, paddingBottom: 7 },
  stageHeader: { backgroundColor: colors.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 9 },
  stageHeaderCopy: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  stageEyebrow: { color: colors.textPrimary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  stageSummary: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', textAlign: 'right' },
  stageTrack: { flexDirection: 'row', alignItems: 'flex-start' },
  stageItem: { alignItems: 'center', width: 38 },
  stageMarker: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceInfo, borderWidth: 1, borderColor: colors.borderStrong },
  stageMarkerComplete: { backgroundColor: colors.action, borderColor: colors.action },
  stageMarkerCurrent: { backgroundColor: colors.accent, borderColor: colors.accent },
  stageNumber: { color: colors.textPrimary, fontWeight: '900', fontSize: 12 },
  stageNumberCurrent: { color: colors.onAction },
  stageConnector: { flex: 1, minWidth: 2, height: 2, borderRadius: 2, backgroundColor: colors.border, marginTop: 13 },
  stageConnectorComplete: { backgroundColor: colors.action },
  stageLabel: { color: colors.textSecondary, fontSize: 9, fontWeight: '800', lineHeight: 11, marginTop: 4, textAlign: 'center' },
  stageLabelCurrent: { color: colors.accent, fontWeight: '900' },
  stageLabelComplete: { color: colors.textPrimary },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 28 },
  bottomSafeArea: { backgroundColor: colors.background },
  bottomNav: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  navButton: { flex: 1 },
});

export default function App() {
  return (
    <AuthProvider>
      <TravelerApp />
    </AuthProvider>
  );
}
