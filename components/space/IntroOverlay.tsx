"use client";

import { useEffect, useMemo, useState } from "react";

const INTRO_TEXT =
  "Water has been discovered across the universe-in ice, vapor, and hidden oceans. While this does not prove that life exists beyond Earth, it has significantly changed how scientists think about where life could exist.\n\nSome argue that water alone is not enough to support life, and that other conditions make extraterrestrial life unlikely. However, the widespread discovery of water has expanded the range of environments scientists consider potentially habitable, making the possibility of life beyond Earth more scientifically plausible than ever before.";

type IntroOverlayProps = {
  onBegin: () => void;
};

export function IntroOverlay({ onBegin }: IntroOverlayProps) {
  const [visibleChars, setVisibleChars] = useState(0);

  const doneTyping = visibleChars >= INTRO_TEXT.length;
  const typedText = useMemo(() => INTRO_TEXT.slice(0, visibleChars), [visibleChars]);

  useEffect(() => {
    if (doneTyping) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisibleChars((prev) => prev + 1);
    }, 18);

    return () => window.clearTimeout(timer);
  }, [doneTyping, visibleChars]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 px-6">
      <div className="max-w-3xl rounded-2xl border border-cyan-200/20 bg-slate-950/55 p-6 text-slate-100 shadow-[0_0_50px_rgba(34,123,184,0.2)] backdrop-blur-xl sm:p-8">
        <h1 className="mb-5 text-2xl font-semibold tracking-wide text-cyan-100 sm:text-3xl">
          Mission Briefing
        </h1>
        <p className="min-h-60 whitespace-pre-line font-mono leading-7 text-slate-200">
          {typedText}
          {!doneTyping && <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-cyan-300" />}
        </p>
        <button
          type="button"
          onClick={onBegin}
          disabled={!doneTyping}
          className="mt-6 rounded-full border border-cyan-300/70 bg-cyan-500/10 px-6 py-2 font-mono font-medium text-cyan-100 shadow-[0_0_18px_rgba(80,200,255,0.33)] transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Begin Exploration
        </button>
      </div>
    </div>
  );
}
