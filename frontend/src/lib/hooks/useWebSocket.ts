'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createWebSocket } from '@/lib/api';
import type { ProgressEvent } from '@/lib/types';

interface UseWebSocketOptions {
  onProgress?: (event: ProgressEvent) => void;
  onComplete?: (event: ProgressEvent) => void;
  onError?: (event: ProgressEvent) => void;
}

export function useJobWebSocket(
  jobId: string | null,
  options: UseWebSocketOptions = {}
) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<ProgressEvent | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    if (!jobId) return;
    // Close existing connection
    if (ws.current) {
      ws.current.close();
    }
    try {
      ws.current = createWebSocket(jobId);

      ws.current.onopen = () => setIsConnected(true);
      ws.current.onclose = () => setIsConnected(false);
      ws.current.onerror = () => setIsConnected(false);

      ws.current.onmessage = (e: MessageEvent) => {
        try {
          const event: ProgressEvent = JSON.parse(e.data as string);
          setLastEvent(event);
          if (event.type === 'completed') {
            optionsRef.current.onComplete?.(event);
          } else if (event.type === 'error') {
            optionsRef.current.onError?.(event);
          } else {
            optionsRef.current.onProgress?.(event);
          }
        } catch {
          // silently ignore parse errors
        }
      };
    } catch {
      // silently ignore connection errors
    }
  }, [jobId]);

  useEffect(() => {
    connect();
    return () => {
      ws.current?.close();
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    ws.current?.close();
    setIsConnected(false);
  }, []);

  return { isConnected, lastEvent, reconnect: connect, disconnect };
}
