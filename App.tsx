import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Button, colors } from './src/components/Primitives';
import { defaultRequest, estimateRequest } from './src/data/mock';
import { API_BASE, createWalkRequest, getSessionStatus, getWalkRequest, health, MarketplaceRequest, sendSessionMessage, SessionMessage, startSession } from './src/api';
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

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [request, setRequest] = useState<WalkRequest>(defaultRequest);
  const [remoteRequest, setRemoteRequest] = useState<MarketplaceRequest | undefined>();
  const [apiOnline, setApiOnline] = useState(false);
  const [apiNote, setApiNote] = useState('Checking backend…');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const estimate = useMemo(() => estimateRequest(request), [request]);

  const currentIndex = screenOrder.indexOf(screen);
  const isFirstScreen = currentIndex === 0;
  const isLastScreen = currentIndex === screenOrder.length - 1;

  const navigateTo = (nextScreen: Screen) => {
    setScreen(nextScreen);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        await health();
        if (!active) return;
        setApiOnline(true);
        setApiNote('Backend connected');
        if (remoteRequest?.id) {
          const data = await getWalkRequest(remoteRequest.id);
          if (!active) return;
          setRemoteRequest(data.request);
          if ((data.request.status === 'accepted' || data.request.status === 'live') && screen === 'matching') {
            navigateTo('confirmed');
          }
          if (data.request.sessionId) {
            try {
              const session = await getSessionStatus(data.request.sessionId);
              if (active) setMessages(session.messages);
            } catch {}
          }
        }
      } catch {
        if (!active) return;
        setApiOnline(false);
        setApiNote('Backend reconnecting');
      }
    };
    poll();
    const timer = setInterval(poll, 2000);
    return () => { active = false; clearInterval(timer); };
  }, [remoteRequest?.id, screen]);

  const goPrevious = () => {
    if (!isFirstScreen) navigateTo(screenOrder[currentIndex - 1]);
  };

  const goNext = () => {
    navigateTo(isLastScreen ? 'request' : screenOrder[currentIndex + 1]);
  };

  const submitRequest = async () => {
    setBusy(true);
    setApiNote('Sending request to guide marketplace…');
    try {
      const data = await createWalkRequest(request);
      setRemoteRequest(data.request);
      setApiOnline(true);
      setApiNote('Request live for guides');
      navigateTo('matching');
    } catch {
      setApiOnline(false);
      setApiNote('Could not send request yet');
    } finally {
      setBusy(false);
    }
  };

  const joinLive = async () => {
    if (remoteRequest?.sessionId) {
      try {
        const data = await startSession(remoteRequest.sessionId);
        setMessages(data.messages);
      } catch {}
    }
    navigateTo('live');
  };

  const sendTravelerMessage = async (text: string) => {
    if (!remoteRequest?.sessionId) return;
    await sendSessionMessage(remoteRequest.sessionId, text);
    const data = await getSessionStatus(remoteRequest.sessionId);
    setMessages(data.messages);
  };

  const resetLocal = () => {
    setRemoteRequest(undefined);
    setMessages([]);
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
          <Text style={styles.backendLine} numberOfLines={1}>{apiNote} • {API_BASE.replace('https://', '')}</Text>
          <View style={styles.stepper}>
            {screenOrder.map((item, index) => {
              const active = item === screen;
              return (
                <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: active }} accessibilityLabel={`Open ${screenLabels[item]} step`} hitSlop={6} onPress={() => navigateTo(item)} style={({ pressed }) => [styles.stepItem, pressed && styles.stepItemPressed]}>
                  <View style={[styles.stepDot, index <= currentIndex && styles.stepDotActive]} />
                  <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>{screenLabels[item]}</Text>
                </Pressable>
              );
            })}
          </View>
          <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator>
            {screen === 'onboarding' ? <OnboardingScreen onStart={() => navigateTo('request')} /> : null}
            {screen === 'request' ? <RequestScreen request={request} onChange={setRequest} onReview={() => navigateTo('review')} /> : null}
            {screen === 'review' ? <ReviewScreen request={request} estimate={estimate} onBack={() => navigateTo('request')} onFindGuide={submitRequest} busy={busy} /> : null}
            {screen === 'matching' ? <MatchingScreen request={request} remoteRequest={remoteRequest} onCheck={async () => remoteRequest && setRemoteRequest((await getWalkRequest(remoteRequest.id)).request)} onReset={resetLocal} /> : null}
            {screen === 'confirmed' ? <ConfirmedScreen request={request} estimate={estimate} remoteRequest={remoteRequest} onJoin={joinLive} /> : null}
            {screen === 'live' ? <LiveWalkScreen remoteRequest={remoteRequest} messages={messages} onSendMessage={sendTravelerMessage} onEnd={() => navigateTo('summary')} /> : null}
            {screen === 'summary' ? <SummaryScreen onNewWalk={resetLocal} /> : null}
          </ScrollView>
          <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
            <View style={styles.bottomNav}>
              <Button label="Previous" icon="chevron-back" variant="secondary" onPress={goPrevious} disabled={isFirstScreen} style={styles.navButton} />
              <Button label={isLastScreen ? 'New walk' : 'Next'} icon={isLastScreen ? 'add-circle' : 'chevron-forward'} onPress={goNext} style={styles.navButton} />
            </View>
          </SafeAreaView>
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
