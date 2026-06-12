"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import {
  candidateKeys,
} from "@/features/candidates/hooks/use-candidates";
import type { CandidateDetail } from "@/features/candidates/types";
import { roleKeys } from "@/features/roles/hooks/use-roles";
import {
  getRealtimeWebSocketUrl,
  type RealtimeServerMessage,
} from "@/lib/realtime";

import { useAuth } from "./auth-provider";

type RealtimeContextValue = {
  isConnected: boolean;
};

const RealtimeContext = createContext<RealtimeContextValue>({
  isConnected: false,
});

const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(BASE_BACKOFF_MS);
  const orgIdRef = useRef<string | null>(null);

  const orgId = activeOrganization?.id ?? null;

  useEffect(() => {
    orgIdRef.current = orgId;
  }, [orgId]);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      let message: RealtimeServerMessage;

      try {
        message = JSON.parse(event.data as string) as RealtimeServerMessage;
      } catch {
        return;
      }

      const currentOrgId = orgIdRef.current;
      if (!currentOrgId) return;

      if (message.type === "candidate.updated") {
        if (message.organizationId !== currentOrgId) return;

        const { candidateId, status, errorMessage } = message.payload;
        const detailKey = candidateKeys.detail(currentOrgId, candidateId);

        void queryClient.invalidateQueries({ queryKey: candidateKeys.lists() });

        if (status === "complete" || status === "failed") {
          void queryClient.invalidateQueries({ queryKey: detailKey });
          void queryClient.invalidateQueries({
            queryKey: candidateKeys.report(currentOrgId, candidateId),
          });
          return;
        }

        queryClient.setQueryData<CandidateDetail>(detailKey, (old) =>
          old ? { ...old, status, errorMessage } : old,
        );
        return;
      }

      if (message.type === "role_export.updated") {
        if (message.organizationId !== currentOrgId) return;

        const { roleId, status, errorMessage } = message.payload;

        void queryClient.invalidateQueries({
          queryKey: roleKeys.detail(currentOrgId, roleId),
        });
        void queryClient.invalidateQueries({
          queryKey: roleKeys.latestExport(currentOrgId, roleId),
        });

        if (status === "failed") {
          toast.error(errorMessage ?? "Role export failed.");
        }
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (!isAuthenticated || !orgId) {
      setIsConnected(false);
      wsRef.current?.close();
      wsRef.current = null;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      return;
    }

    let disposed = false;

    function scheduleReconnect() {
      if (disposed) return;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);

      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, delay);
    }

    function connect() {
      if (disposed) return;

      const ws = new WebSocket(getRealtimeWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        backoffRef.current = BASE_BACKOFF_MS;
        setIsConnected(true);
        ws.send(JSON.stringify({ type: "subscribe", organizationId: orgId }));
      };

      ws.onmessage = handleMessage;

      ws.onclose = () => {
        setIsConnected(false);
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        if (!disposed) {
          scheduleReconnect();
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
      setIsConnected(false);
      backoffRef.current = BASE_BACKOFF_MS;
    };
  }, [handleMessage, isAuthenticated, orgId]);

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext);
}
