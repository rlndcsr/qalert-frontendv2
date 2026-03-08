"use client";

import { useEffect, useRef } from "react";

const SSE_URL = "/api/events";

/**
 * Opens a persistent SSE connection and calls the appropriate handler
 * when the backend emits a named event.
 *
 * Handlers are stored in a ref so they can be updated on every render
 * without tearing down and re-establishing the connection.
 *
 * @param {Record<string, (data: any) => void>} handlers - map of event name → callback
 * @param {boolean} enabled - set to false to keep the connection closed (e.g. while logged out)
 */
export function useSseEvents(handlers, enabled = true) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const es = new EventSource(SSE_URL);

    const registeredEvents = Object.keys(handlersRef.current);
    console.log("[SSE] Connection opened. Listening for:", registeredEvents);

    const boundListeners = {};

    registeredEvents.forEach((eventName) => {
      const listener = (e) => {
        let data = e.data;
        try {
          data = JSON.parse(e.data);
        } catch {
          // non-JSON payload — pass raw string through
        }
        console.log(`[SSE] Event received: "${eventName}"`, data);
        handlersRef.current[eventName]?.(data);
      };
      boundListeners[eventName] = listener;
      es.addEventListener(eventName, listener);
    });

    es.onerror = () => {
      // EventSource reconnects automatically — this is informational only
      console.warn(
        "SSE: connection lost, browser will reconnect automatically.",
      );
    };

    return () => {
      Object.entries(boundListeners).forEach(([name, listener]) => {
        es.removeEventListener(name, listener);
      });
      es.close();
    };
  }, [enabled]);
}
