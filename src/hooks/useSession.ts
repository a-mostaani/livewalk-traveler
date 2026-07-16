import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createWalkRequest, endSession, estimateWalkRequest, getSessionStatus, getWalkRequest, health, sendSessionMessage } from '../api';
import { hasRouteCoordinates, type Estimate, type LiveSession, type MarketplaceRequest, type Screen, type SessionMessage, type WalkRequest } from '../types';

type UseSessionArgs = {
  enabled: boolean;
  localRequest: WalkRequest;
  currentScreen: Screen;
  onAccepted: () => void;
};

export function useSession({ enabled, localRequest, currentScreen, onAccepted }: UseSessionArgs) {
  const [request, setRequest] = useState<MarketplaceRequest | undefined>();
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [liveSession, setLiveSession] = useState<LiveSession | undefined>();
  const [apiOnline, setApiOnline] = useState(false);
  const [apiNote, setApiNote] = useState('Checking backend…');
  const [busy, setBusy] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | undefined>();
  const [estimateBusy, setEstimateBusy] = useState(false);
  const [estimateError, setEstimateError] = useState<string | undefined>();
  const estimateSequence = useRef(0);

  const guideHasStartedLive = useMemo(
    () => Boolean(request?.sessionId && request?.status === 'live'),
    [request?.sessionId, request?.status],
  );
  const sessionEnded = useMemo(
    () => request?.status === 'completed' || liveSession?.status === 'ended',
    [request?.status, liveSession?.status],
  );

  const refresh = useCallback(async () => {
    await health();
    setApiOnline(true);
    setApiNote('Backend connected');

    if (!request?.id) return undefined;
    const data = await getWalkRequest(request.id);
    setRequest(data.request);
    if (data.session) setLiveSession(data.session);
    if (data.request.status === 'completed') setApiNote('Walk complete');

    if ((data.request.status === 'accepted' || data.request.status === 'live') && currentScreen === 'matching') {
      onAccepted();
    }

    if (data.request.sessionId) {
      const session = await getSessionStatus(data.request.sessionId);
      setMessages(session.messages);
      setLiveSession(session.session);
      if (session.session.status === 'ended') setApiNote('Walk complete');
    }

    return data.request;
  }, [request?.id, currentScreen, onAccepted]);

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
    setEstimate(undefined);
    setEstimateBusy(false);
    setEstimateError(undefined);
  }, []);

  return {
    request,
    liveSession,
    messages,
    apiOnline,
    apiNote,
    busy,
    estimate,
    estimateBusy,
    estimateError,
    guideHasStartedLive,
    sessionEnded,
    refresh,
    quoteRequest,
    clearEstimate,
    submitRequest,
    joinLive,
    sendMessage,
    endLive,
    reset,
  };
}
