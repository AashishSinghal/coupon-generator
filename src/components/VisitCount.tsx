"use client";

import { useEffect, useState } from "react";

// Visit counts for all of Aashish's sites live behind one API on the portfolio
// (github.com/AashishSinghal/portfolio-nextjs, api/visitor-count.ts). This site's
// name there is "coupon-press".
const COUNTER_URL = "https://aashishsinghal.com/api/visitor-count?site=coupon-press";
const COUNTED_KEY = "visit-counted-on";

// One request per page load, shared by every mount (StrictMode runs effects twice in dev,
// and a second POST would count the visit twice)
let request: Promise<number | null> | null = null;

function recordVisit(): Promise<number | null> {
  const today = new Date().toISOString().slice(0, 10);
  let countedToday = false;
  try {
    countedToday = localStorage.getItem(COUNTED_KEY) === today;
  } catch {
    // Storage blocked: count the visit anyway
  }
  // Local development reads the live count but never adds to it
  const record = !countedToday && process.env.NODE_ENV === "production";

  return fetch(COUNTER_URL, { method: record ? "POST" : "GET" })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (typeof data?.count !== "number") return null;
      if (record) {
        try {
          localStorage.setItem(COUNTED_KEY, today);
        } catch {
          // Ignore: worst case this browser is counted again
        }
      }
      return data.count as number;
    })
    .catch(() => null);
}

// Counts this browser at most once a day, then shows the running total. Stays hidden when
// the counter is unavailable, so it never shows a made-up number.
export function VisitCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    request ??= recordVisit();
    request.then((value) => {
      if (active) setCount(value);
    });
    return () => {
      active = false;
    };
  }, []);

  if (count === null) return null;

  return (
    <span className="tabular-nums">
      {count.toLocaleString()} {count === 1 ? "visit" : "visits"}
    </span>
  );
}
