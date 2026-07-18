import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cancelWalkRequest, createWalkRequest, endSession, estimateWalkRequest, getSessionStatus, getWalkRequest, getWalkRequests, health, sendSessionMessage } from '../api';
import { hasRouteCoordinates, type Estimate, type LiveSession, type MarketplaceRequest, type Screen, type SessionMessage, type WalkRequest } from '../types';
import { getWalkHistoryState, type WalkHistoryState } from '../flow';
import { isPreLiveRequest, selectResumableRequest, shouldApplyRemoteRequest, SingleFlightRefresh } from '../requestState';

type UseSessionArgs = {
  enabled: boolean;
  localRequest: WalkRequest;
  currentScreen: Screen;
  onAccepted: () => void;
};

export function useSession({ enabled, localRequest, currentScreen, onAccepted }: UseSessionArgs) {
  const [request, setRequest] = useState<MarketplaceRequest | undefined>();
  const [requestHistory, setRequestHistory] = useState<MarketplaceRequest[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyUnavailable, setHistoryUnavailable] = useState(false);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [liveSession, setLiveSession] = useState<LiveSession | undefined>();
  const [apiOnline, setApiOnline] = useState(false);
  const [apiNote, setApiNote] = useState('Checking backend…');
  const [busy, setBusy] = useState(false);
  const [cancellingRequestId, setCancellingRequestId] = useState<string | undefined>();
  const [cancelError, setCancelError] = useState<string | undefined>();
  const [estimate, setEstimate] = useState<Estimate | undefined>();
  const [estimateBusy, setEstimateBusy] = useState(false);
  const [estimateError, setEstimateError] = useState<string | undefined>();
  const estimateSequence = useRef(0);
  const cancelInFlight = useRef<string | undefined>(undefined);
  const requestRef = useRef<MarketplaceRequest | undefined>(undefined);
  const enabledRef = useRef(enabled);
  const currentScreenRef = useRef(currentScreen);
  const onAcceptedRef = useRef(onAccepted);
  const refreshFlightRef = useRef(new SingleFlightRefresh());

  requestRef.current = request;
  enabledRef.current = enabled;
  currentScreenRef.current = currentScreen;
  onAcceptedRef.current = onAccepted;

  const cancelBusy = cancellingRequestId === request?.id;

  const guideHasStartedLive = useMemo(
    () => Boolean(request?.sessionId && request?.status === 'live'),
    [request?.sessionId, request?.status],
  );
  const sessionEnded = useMemo(
    () => request?.status === 'completed' || liveSession?.status === 'ended',
    [request?.status, liveSession?.status],
  );

  const walkHistoryState = useMemo<WalkHistoryState>(() => {
    if (historyUnavailable) return 'unavailable';
    return getWalkHistoryState({
      isLoading: historyLoading,
      hasLoaded: historyLoaded,
      requestCount: requestHistory.length,
    });
  }, [historyLoaded, historyLoading, historyUnavailable, requestHistory.length]);

  const loadWalkHistory = useCallback(async () => {
    if (!enabled) {
      setRequestHistory([]);
      setHistoryLoaded(false);
      setHistoryLoading(false);
      setHistoryUnavailable(false);
      return;
    }

    setHistoryLoading(true);
    setHistoryUnavailable(false);
    try {
      const data = await getWalkRequests();
      setRequestHistory(data.requests);
      setRequest((current) => current ?? selectResumableRequest(data.requests));
      setHistoryLoaded(true);
    } catch {
      setHistoryUnavailable(true);
    } finally {
      setHistoryLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void loadWalkHistory();
  }, [loadWalkHistory]);

  const refresh = useCallback(() => refreshFlightRef.current.run(async () => {
    if (!enabledRef.current) return undefined;

    try {
      await health();
      setApiOnline(true);
      setApiNote('Backend connected');

      const currentRequest = requestRef.current;
      const requestId = currentRequest?.id;
      if (!requestId) return undefined;

      const data = await getWalkRequest(requestId);
      if (!shouldApplyRemoteRequest(requestRef.current, data.request) || cancelInFlight.current === requestId) return undefined;
      setRequest(data.request);
      if (data.session) setLiveSession(data.session);
      if (data.request.status === 'completed') setApiNote('Walk complete');

      if ((data.request.status === 'accepted' || data.request.status === 'live') && currentScreenRef.current === 'matching') {
        onAcceptedRef.current();
      }

      if (data.request.sessionId) {
        const session = await getSessionStatus(data.request.sessionId);
        if (!shouldApplyRemoteRequest(requestRef.current, data.request) || cancelInFlight.current === requestId) return undefined;
        setMessages(session.messages);
        setLiveSession(session.session);
        if (session.session.status === 'ended') setApiNote('Walk complete');
      }

      return data.request;
    } catch (error) {
      setApiOnline(false);
      setApiNote('Backend reconnecting');
      throw error;
    }
  }), []);

  useEffect(() => {
    if (!enabled) {
      setApiOnline(false);
      setApiNote('Log in to connect backend');
      return;
    }

    let active = true;
    const poll = async () => {
      try {
        await refresh();
      } catch {
        if (!active) return;
        setApiOnline(false);
        setApiNote('Backend reconnecting');
      }
    };

    poll();
    const timer = setInterval(poll, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [enabled, refresh]);

  const clearEstimate = useCallback(() => {
    estimateSequence.current += 1;
    setEstimate(undefined);
    setEstimateBusy(false);
    setEstimateError(undefined);
  }, []);

  const quoteRequest = useCallback(async () => {
    const sequence = estimateSequence.current + 1;
    estimateSequence.current = sequence;
    if (!hasRouteCoordinates(localRequest)) {
      setEstimate(undefined);
      setEstimateError('Select a real place for both route points before requesting a quote.');
      return undefined;
    }

    setEstimateBusy(true);
    setEstimateError(undefined);
    setEstimate(undefined);
    try {
      const data = await estimateWalkRequest(localRequest);
      if (estimateSequence.current !== sequence) return undefined;
      setEstimate(data.estimate);
      setApiOnline(true);
      setApiNote('Route quote ready');
      return data.estimate;
    } catch (error) {
      if (estimateSequence.current !== sequence) return undefined;
      setEstimate(undefined);
      setEstimateError(error instanceof Error ? error.message : 'Could not calculate your route quote.');
      return undefined;
    } finally {
      if (estimateSequence.current === sequence) setEstimateBusy(false);
    }
  }, [localRequest]);

  useEffect(() => {
    if (!enabled || currentScreen !== 'review') return;
    void quoteRequest();
  }, [currentScreen, enabled, quoteRequest]);

  const submitRequest = useCallback(async () => {
    if (!hasRouteCoordinates(localRequest) || !estimate || estimateBusy || estimateError) {
      setApiNote('Wait for a valid route quote before sending this request.');
      return false;
    }
    setBusy(true);
    setApiNote('Sending request to guide marketplace…');
    try {
      const data = await createWalkRequest(localRequest);
      setRequest(data.request);
      setRequestHistory((history) => [data.request, ...history.filter((item) => item.id !== data.request.id)]);
      setHistoryLoaded(true);
      setHistoryUnavailable(false);
      setApiOnline(true);
      setApiNote('Request live for guides');
      return true;
    } catch {
      setApiOnline(false);
      setApiNote('Could not send request yet');
      return false;
    } finally {
      setBusy(false);
    }
  }, [estimate, estimateBusy, estimateError, localRequest]);

  const joinLive = useCallback(async () => {
    if (!guideHasStartedLive || !request?.sessionId) return false;
    try {
      const data = await getSessionStatus(request.sessionId);
      setMessages(data.messages);
      setLiveSession(data.session);
    } catch {}
    return true;
  }, [guideHasStartedLive, request?.sessionId]);

  const cancelRequest = useCallback(async () => {
    if (!request?.id || !isPreLiveRequest(request) || cancelInFlight.current) return false;

    const requestId = request.id;
    cancelInFlight.current = requestId;
    setCancellingRequestId(requestId);
    setCancelError(undefined);
    setApiNote('Cancelling your request…');
    try {
      const data = await cancelWalkRequest(requestId);
      if (data.request.status !== 'cancelled') throw new Error('LiveWalk could not confirm the cancellation. Please retry.');
      setRequest(data.request);
      setRequestHistory((history) => history.map((item) => item.id === requestId ? data.request : item));
      setLiveSession(data.session ?? undefined);
      setMessages([]);
      setApiOnline(true);
      setApiNote('Request cancelled');
      return true;
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : 'Could not cancel this request. Please try again.');
      setApiNote('Could not cancel request');
      return false;
    } finally {
      if (cancelInFlight.current === requestId) cancelInFlight.current = undefined;
      setCancellingRequestId(undefined);
    }
  }, [request]);

  const sendMessage = useCallback(async (text: string) => {
    if (!request?.sessionId) return;
    await sendSessionMessage(request.sessionId, text);
    const data = await getSessionStatus(request.sessionId);
    setMessages(data.messages);
    setLiveSession(data.session);
  }, [request?.sessionId]);

  const endLive = useCallback(async () => {
    if (!request?.sessionId) return false;
    setBusy(true);
    try {
      const data = await endSession(request.sessionId);
      setMessages(data.messages);
      setLiveSession(data.session);
      setRequest({ ...request, status: 'completed' });
      setApiOnline(true);
      setApiNote('Walk complete');
      return true;
    } catch {
      setApiNote('Could not end the shared walk yet');
      return false;
    } finally {
      setBusy(false);
    }
  }, [request]);

  const reset = useCallback(() => {
    estimateSequence.current += 1;
    setRequest(undefined);
    setMessages([]);
    setLiveSession(undefined);
    cancelInFlight.current = undefined;
    setCancellingRequestId(undefined);
    setCancelError(undefined);
    setEstimate(undefined);
    setEstimateBusy(false);
    setEstimateError(undefined);
  }, []);

  return {
    request,
    requestHistory,
    walkHistoryState,
    liveSession,
    messages,
    apiOnline,
    apiNote,
    busy,
    cancelBusy,
    cancelError,
    estimate,
    estimateBusy,
    estimateError,
    guideHasStartedLive,
    sessionEnded,
    refresh,
    quoteRequest,
    clearEstimate,
    submitRequest,
    cancelRequest,
    joinLive,
    sendMessage,
    endLive,
    reset,
  };
}
