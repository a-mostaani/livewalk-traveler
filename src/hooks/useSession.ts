import { useCallback, useEffect, useMemo, useState } from 'react';
import { createWalkRequest, getSessionStatus, getWalkRequest, health, sendSessionMessage } from '../api';
import type { LiveSession, MarketplaceRequest, Screen, SessionMessage, WalkRequest } from '../types';

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

  const guideHasStartedLive = useMemo(
    () => Boolean(request?.sessionId && request?.status === 'live'),
    [request?.sessionId, request?.status],
  );

  const refresh = useCallback(async () => {
    await health();
    setApiOnline(true);
    setApiNote('Backend connected');

    if (!request?.id) return undefined;
    const data = await getWalkRequest(request.id);
    setRequest(data.request);
    if (data.session) setLiveSession(data.session);

    if ((data.request.status === 'accepted' || data.request.status === 'live') && currentScreen === 'matching') {
      onAccepted();
    }

    if (data.request.sessionId) {
      const session = await getSessionStatus(data.request.sessionId);
      setMessages(session.messages);
      setLiveSession(session.session);
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

  const submitRequest = useCallback(async () => {
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
  }, [localRequest]);

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

  const reset = useCallback(() => {
    setRequest(undefined);
    setMessages([]);
    setLiveSession(undefined);
  }, []);

  return {
    request,
    liveSession,
    messages,
    apiOnline,
    apiNote,
    busy,
    guideHasStartedLive,
    refresh,
    submitRequest,
    joinLive,
    sendMessage,
    reset,
  };
}
