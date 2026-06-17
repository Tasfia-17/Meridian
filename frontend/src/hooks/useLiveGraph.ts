import { useEffect, useRef } from "react";
import { api } from "../lib/api";
import { useStore } from "../store";

export function useLiveGraph() {
  const ws = useRef<WebSocket | null>(null);
  const { setSnapshot, pushHistory } = useStore();

  useEffect(() => {
    const connect = () => {
      const sock = new WebSocket(api.wsUrl());
      ws.current = sock;

      sock.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === "tick" || data.ts) {
            const snap = data.type === "tick" ? data : data;
            setSnapshot(snap);
            pushHistory(snap);
          }
        } catch (_) {}
      };

      sock.onclose = () => {
        // Reconnect after 2s
        setTimeout(connect, 2000);
      };

      // Keepalive ping every 25s
      const ping = setInterval(() => {
        if (sock.readyState === WebSocket.OPEN) sock.send("ping");
      }, 25000);

      sock.onclose = () => {
        clearInterval(ping);
        setTimeout(connect, 2000);
      };
    };

    connect();
    return () => ws.current?.close();
  }, []);
}
