import { useState, useEffect, useRef } from "react";

/**
 * useStandaloneTimer
 *
 * Countdown for standalone practice tests, which have no session and therefore
 * no server-side start time to query. Purely client-side: the clock starts when
 * the hook mounts with enabled=true, and a page refresh restarts it.
 *
 * Returns the SAME shape as useModuleTimer so the exam components
 * (timerFormatted / timerWarning / timerDanger) work unchanged in both flows.
 *
 * onExpire fires exactly once, at zero. Callers pass it the module's
 * autoSubmitRef so time-up submits the answers, matching the real exam.
 *
 *   seconds  — total duration (see standaloneTimeLimits.js)
 *   enabled  — hold off until the test has actually loaded
 *   onExpire — called once when the countdown reaches 0
 */
export function useStandaloneTimer({ seconds, enabled = true, onExpire }) {
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  const intervalRef = useRef(null);
  const expiredRef = useRef(false);
  // Hold onExpire in a ref so a caller passing an inline arrow does not restart
  // the countdown on every render.
  const onExpireRef = useRef(onExpire);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  // Start (or restart, if the duration changes) the countdown.
  useEffect(() => {
    if (!enabled || !seconds) return;

    setSecondsLeft(seconds);
    setIsExpired(false);
    expiredRef.current = false;

    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s === null) return s;
        if (s <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          if (!expiredRef.current) {
            expiredRef.current = true;
            setIsExpired(true);
            // Defer out of the setState updater so the submit handler does not
            // run during React's render phase.
            setTimeout(() => onExpireRef.current?.(), 0);
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
  }, [seconds, enabled]);

  const formatted = secondsLeft === null
    ? "--:--"
    : `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const isWarning = secondsLeft !== null && secondsLeft < 300;
  const isDanger = secondsLeft !== null && secondsLeft < 60;

  return { secondsLeft, formatted, isExpired, isWarning, isDanger };
}
