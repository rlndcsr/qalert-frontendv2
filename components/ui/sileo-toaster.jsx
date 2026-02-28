"use client";

import { useEffect, useState } from "react";
import { Toaster as SileoToaster } from "sileo";

const MOBILE_BREAKPOINT = 640;

export default function ResponsiveSileoToaster() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

    const handleChange = (event) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <SileoToaster
      position={isMobile ? "top-center" : "top-right"}
      theme="light"
      options={{ fill: "#111111" }}
    />
  );
}
