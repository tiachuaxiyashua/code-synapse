import { useCallback, useEffect, useRef, useState } from 'react';

const CHANNEL = 'code_synapse-prototype';

export function useSharedScope(defaultScope) {
  const params = new URLSearchParams(window.location.search);
  const [scope, setScopeState] = useState(params.get('scope') || defaultScope);
  const [following, setFollowing] = useState(params.get('follow') !== '0');
  const channelRef = useRef(null);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL);
    channelRef.current = channel;
    channel.onmessage = ({ data }) => {
      if (data?.type === 'scope' && following) {
        setScopeState(data.scope);
      }
    };
    return () => channel.close();
  }, [following]);

  const setScope = useCallback((nextScope) => {
    setScopeState(nextScope);
    channelRef.current?.postMessage({ type: 'scope', scope: nextScope, timestamp: Date.now() });
  }, []);

  return { scope, setScope, following, setFollowing };
}
