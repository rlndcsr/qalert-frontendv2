"use client";

import { useState, useEffect } from "react";

export function useSystemStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const response = await fetch(
          "https://intercarpellary-rosana-indivisibly.ngrok-free.dev/api/system-status"
        );
        const data = await response.json();
        setIsOnline(data.is_online === 1);
      } catch (error) {
        console.error("Failed to fetch system status:", error);
        // Assume offline if API call fails
        setIsOnline(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial check
    checkSystemStatus();

    // Poll every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return { isOnline, isLoading };
}
