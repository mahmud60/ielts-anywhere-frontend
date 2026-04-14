import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./api";

/**
 * useModuleTimer
 *
 * Resets properly when current_module changes.
 * Both sessionId AND currentModule are dependencies — when the student
 * advances from listening to reading, currentModule changes, the effect
 * re-runs, start-module is called for the new module, and a fresh
 * countdown begins from the new module's time limit.
 */
export function useModuleTimer({ sessionId, currentModule, onExpire, enabled = true }) {
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);
  const intervalRef = useRef(null);

  // Keep onExpire ref current without re-running the effect
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // Reset and initialise whenever the module changes
  useEffect(() => {
    if (!sessionId || !enabled || !currentModule || currentModule === "complete") return;

    // Clear any running countdown from the previous module
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset state for the new module
    setSecondsLeft(null);
    setIsExpired(false);
    hasExpiredRef.current = false;

    async function init() {
      try {
        // Tell backend this module has started (no-op if already started)
        await api.startModule(sessionId);
        // Get how many seconds are actually left (accounts for time already elapsed)
        const data = await api.getTimeRemaining(sessionId);

        if (data.expired) {
          setIsExpired(true);
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onExpireRef.current?.();
          }
        } else {
          setSecondsLeft(data.seconds_remaining);
        }
      } catch (e) {
        console.error("Timer init error:", e.message);
      }
    }

    init();

    // Cleanup on module change or unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // currentModule in deps ensures this re-runs when module advances
  }, [sessionId, currentModule, enabled]);

  // Start countdown once we have a valid secondsLeft value
  useEffect(() => {
    if (secondsLeft === null || isExpired || !enabled) return;
    if (intervalRef.current) return; // already ticking

    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsExpired(true);
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onExpireRef.current?.();
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