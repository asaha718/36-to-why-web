import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface PartnerLinkedPayload {
  partnerName: string;
  inviteCode: string;
}

export function useSocket(
  sessionId: string | null,
  onPartnerLinked: (payload: PartnerLinkedPayload) => void
) {
  const callbackRef = useRef(onPartnerLinked);
  useEffect(() => {
    callbackRef.current = onPartnerLinked;
  });

  useEffect(() => {
    if (!sessionId) return;
    const socket: Socket = io({ query: { sessionId } });
    socket.on("partnerLinked", (p: PartnerLinkedPayload) => callbackRef.current(p));
    return () => {
      socket.disconnect();
    };
  }, [sessionId]);
}
