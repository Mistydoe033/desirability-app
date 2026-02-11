import { useRef } from 'react';

export function useLatestRequestGuard() {
  const latestRequestId = useRef(0);

  const startRequest = (): number => {
    latestRequestId.current += 1;
    return latestRequestId.current;
  };

  const isLatest = (requestId: number): boolean => requestId === latestRequestId.current;

  return {
    startRequest,
    isLatest
  };
}
