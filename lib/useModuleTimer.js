import { useState, useEffect, useRef } from "react";
import { api } from "./api";

/**
 * useModuleTimer
 *
 * Tracks remaining time for the current module.
 * When time runs out, sets isExpired = true.
 * Does NOT auto-submit — the caller decides what to do on expiry.
 * Resets cleanly when currentModule changes.
 */
export function useModuleTimer({ sessionId, currentModule, enabled = true }) {
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [isExpired, setIsExpired]     = useState(false);
  const intervalRef = useRef(null);
  const expiredRef  = useRef(false);   // prevent double-firing

  // Reset and fetch fresh time whenever module changes
  useEffect(() => {
    if (!sessionId || !enabled || !currentModule || currentModule === "complete") return;

    // Clear previous countdown
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset state for new module
    setSecondsLeft(null);
    setIsExpired(false);
    expiredRef.current = false;

    async function init() {
      try {
        await api.startModule(sessionId);
        const data = await api.getTimeRemaining(sessionId);

        if (data.expired) {
          setIsExpired(true);
          expiredRef.current = true;
        } else {
          setSecondsLeft(data.seconds_remaining);
        }
      } catch (e) {
        console.error("Timer init error:", e.message);
      }
    }

    init();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, currentModule, enabled]);

  // Countdown tick — starts once we have a valid secondsLeft
  useEffect(() => {
    if (secondsLeft === null || isExpired || !enabled) return;
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          if (!expiredRef.current) {
            expiredRef.current = true;
            setIsExpired(true);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [secondsLeft, isExpired, enabled]);

  const formatted = secondsLeft === null
    ? "--:--"
    : `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const isWarning = secondsLeft !== null && secondsLeft < 300;
  const isDanger  = secondsLeft !== null && secondsLeft < 60;

  return { secondsLeft, formatted, isExpired, isWarning, isDanger };
}