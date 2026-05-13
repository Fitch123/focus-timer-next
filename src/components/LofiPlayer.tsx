"use client";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

type YTPlayer = {
  loadVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
  mute: () => void;
  unMute: () => void;
  seekTo: (time: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};

type YTEvent = {
  target: YTPlayer;
  data?: number;
};

import { useEffect, useRef, useState } from "react";

const streams = [
  { label: "Lofi Girl", id: "jfKfPfyJRdk" },
  { label: "Chillhop", id: "5yx6BWlEVcY" },
  { label: "Synthwave", id: "4xDzrJKXOOY" },
  { label: "Zelda Lofi", id: "MsCrN9dvTcw" },
];

function IconMusic() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
function IconPlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}
function IconSkipBack() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19,20 9,12 19,4" />
      <rect x="5" y="4" width="2" height="16" rx="1" />
    </svg>
  );
}
function IconSkipForward() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,4 15,12 5,20" />
      <rect x="17" y="4" width="2" height="16" rx="1" />
    </svg>
  );
}
function IconVolume({ muted }: { muted: boolean }) {
  return muted ? (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polygon
        points="11,5 6,9 2,9 2,15 6,15 11,19"
        fill="currentColor"
        stroke="none"
      />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  ) : (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polygon
        points="11,5 6,9 2,9 2,15 6,15 11,19"
        fill="currentColor"
        stroke="none"
      />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}
function IconChevron() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="6,9 12,15 18,9" />
    </svg>
  );
}

export default function LofiPlayer() {
  const ytPlayer = useRef<YTPlayer | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const apiReady = useRef(false);
  const playerReady = useRef(false);
  const pendingVolume = useRef<number | null>(null);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const current = streams[index];
  const volPct = muted ? 0 : volume;

  // Init YT API
  useEffect(() => {
    const initPlayer = () => {
      if (!playerRef.current || apiReady.current) return;
      apiReady.current = true;

      ytPlayer.current = new window.YT.Player(playerRef.current, {
        videoId: streams[0].id,
        playerVars: { autoplay: 0, controls: 0 },
        events: {
          onReady: (e: YTEvent) => {
            playerReady.current = true;
            e.target.setVolume(pendingVolume.current ?? volume);
            pendingVolume.current = null;
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      if (!document.getElementById("yt-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, []);

  // Change stream — autoplay on switch
  useEffect(() => {
    if (!ytPlayer.current?.loadVideoById) return;
    ytPlayer.current.loadVideoById(streams[index].id);
    ytPlayer.current.playVideo();
    setPlaying(true);
  }, [index]);

  // Volume sync
  useEffect(() => {
    if (!playerReady.current) {
      pendingVolume.current = volume;
      return;
    }
    ytPlayer.current?.setVolume(volume);
  }, [volume]);

  const togglePlay = () => {
    if (!ytPlayer.current) return;
    if (playing) {
      ytPlayer.current.pauseVideo();
      setPlaying(false);
    } else {
      ytPlayer.current.playVideo();
      setPlaying(true);
    }
  };

  const next = () => setIndex((i) => (i + 1) % streams.length);
  const prev = () => setIndex((i) => (i - 1 + streams.length) % streams.length);

  const toggleMute = () => {
    if (!ytPlayer.current) return;
    if (muted) ytPlayer.current.unMute();
    else ytPlayer.current.mute();
    setMuted(!muted);
  };

  return (
    <>
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border backdrop-blur-xl"
          style={{
            background: "var(--card)",
            borderColor: "rgba(0,0,0,0.08)",
            boxShadow: "var(--shadow)",
          }}
        >
          {/* Track selector */}
          <div
            className="relative flex items-center gap-1.5 cursor-pointer select-none"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span style={{ color: "var(--ring)" }}>
              <IconMusic />
            </span>
            <span
              className="text-[13px] font-medium tracking-tight"
              style={{ color: "var(--text)" }}
            >
              {current.label}
            </span>
            <span style={{ color: "var(--muted)" }}>
              <IconChevron />
            </span>

            {menuOpen && (
              <div
                className="absolute bottom-[calc(100%+10px)] left-0 min-w-[155px] rounded-xl border backdrop-blur-xl shadow-xl p-1 z-10"
                style={{
                  background: "var(--card)",
                  borderColor: "rgba(0,0,0,0.08)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {streams.map((s, i) => (
                  <button
                    key={s.id}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-[13px] tracking-tight transition-colors hover:bg-black/5"
                    style={{
                      color: i === index ? "var(--ring)" : "var(--text)",
                      fontWeight: i === index ? 500 : 400,
                    }}
                    onClick={() => {
                      setIndex(i);
                      setMenuOpen(false);
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Separator */}
          <div
            className="w-px h-[18px] flex-shrink-0"
            style={{ background: "rgba(0,0,0,0.08)" }}
          />

          {/* Playback controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={prev}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-full hover:bg-black/6 active:bg-black/10 active:scale-95 transition-all"
              style={{ color: "var(--text)" }}
            >
              <IconSkipBack />
            </button>
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-full hover:bg-black/6 active:bg-black/10 active:scale-95 transition-all"
              style={{ color: "var(--text)" }}
            >
              {playing ? <IconPause /> : <IconPlay />}
            </button>
            <button
              onClick={next}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-full hover:bg-black/6 active:bg-black/10 active:scale-95 transition-all"
              style={{ color: "var(--text)" }}
            >
              <IconSkipForward />
            </button>
          </div>

          {/* Separator */}
          <div
            className="w-px h-[18px] flex-shrink-0"
            style={{ background: "rgba(0,0,0,0.08)" }}
          />

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="transition-opacity hover:opacity-80"
              style={{ color: "var(--muted)" }}
            >
              <IconVolume muted={muted} />
            </button>
            <div
              className="relative w-[76px] h-[3px] rounded-full"
              style={{ background: "rgba(0,0,0,0.1)" }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 rounded-full pointer-events-none"
                style={{ width: `${volPct}%`, background: "var(--ring)" }}
              />
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={volPct}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (muted && v > 0) {
                    ytPlayer.current?.unMute();
                    setMuted(false);
                  }
                }}
                className="vol-slider absolute inset-0 w-full opacity-0 cursor-pointer"
                style={{ top: "-10px", height: "calc(100% + 20px)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden YT mount */}
      <div ref={playerRef} className="yt-hidden" />
    </>
  );
}
