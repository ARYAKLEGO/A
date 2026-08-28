import { useEffect, useRef, useState } from "react";

export default function CountUp({ value }: { value: number | null }) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (value === null) return;
    const start = performance.now();
    const from = 0;
    const duration = 800;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value]);

  if (value === null) return <span>—</span>;
  return <span>{display.toLocaleString("id-ID")}</span>;
}
