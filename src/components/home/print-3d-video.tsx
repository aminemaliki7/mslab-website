"use client";

import { useEffect, useRef, useState } from "react";

type Source = { src: string; type: "video/webm" | "video/mp4" };

/**
 * Looping, muted timelapse for the 3D printing section. Nothing downloads until the section
 * reaches the screen (preload="none"); it plays while visible and pauses off screen. Visitors who
 * prefer reduced motion or save data see the poster and start it themselves. Tapping/clicking
 * the clip pauses or plays it (WCAG 2.2.2: moving content longer than 5 s can be paused).
 */
export function Print3dVideo({
  sources,
  poster,
  label,
  labels,
}: {
  sources: Source[];
  poster: string;
  /** Accessible description of what the clip shows. */
  label: string;
  labels: { pause: string; play: string };
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Poster only until the visitor presses play.
    if (reduce || connection?.saveData) userPaused.current = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && !userPaused.current) video.play().catch(() => {});
        else if (!entry.isIntersecting) video.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  function toggle() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      userPaused.current = false;
      video.play().catch(() => {});
    } else {
      userPaused.current = true;
      video.pause();
    }
  }

  return (
    <>
      <video
        ref={ref}
        className="absolute inset-0 size-full object-cover"
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        {sources.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
      </video>
      {/* No visible control (owner, 2026-11-25): the whole clip is the pause/play target —
          tap or click it, or focus it with the keyboard (ring only on keyboard focus). */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? labels.pause : labels.play}
        className="absolute inset-0 z-10 rounded-[inherit] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
      />
    </>
  );
}
