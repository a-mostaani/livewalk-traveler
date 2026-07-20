import { useEffect, useRef, useState } from 'react';
import { fetchLiveKitToken } from '../api';
import { TravelerSubscribeController, getConnectionProps, type TravelerSubscribeState } from './travelerSubscribe';

export function useTravelerSubscribe(sessionId: string | undefined, enabled: boolean) {
  const controllerRef = useRef<TravelerSubscribeController | null>(null);
  const controller = controllerRef.current ?? (controllerRef.current = new TravelerSubscribeController({
    fetchToken: (id) => fetchLiveKitToken(id),
  }));
  const [state, setState] = useState<TravelerSubscribeState>(() => controller.getState());

  useEffect(() => {
    let cancelled = false;
    if (enabled && sessionId) {
      void controller.start(sessionId).then((next) => {
        if (!cancelled) setState(next);
      });
    } else {
      setState(controller.stop());
    }
    return () => {
      cancelled = true;
      setState(controller.stop());
    };
  }, [controller, enabled, sessionId]);

  return { state, connectionProps: getConnectionProps(state), stop: () => setState(controller.stop()) };
}
