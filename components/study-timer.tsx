"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

const presets = [25, 50, 90] as const;

const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;

export function StudyTimer({ compact = false }: { compact?: boolean }) {
  const [minutes, setMinutes] = useState<(typeof presets)[number]>(25);
  const [seconds, setSeconds] = useState(minutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          setRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const selectPreset = (value: (typeof presets)[number]) => {
    setMinutes(value);
    setSeconds(value * 60);
    setRunning(false);
  };

  return (
    <div className={compact ? "space-y-3" : "notion-card p-5 sm:p-6"}>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {presets.map((preset) => (
          <button
            type="button"
            key={preset}
            onClick={() => selectPreset(preset)}
            className={`min-h-11 shrink-0 rounded-md px-4 text-sm font-semibold ${
              minutes === preset
                ? "bg-[#191919] text-white"
                : "border border-[#e6e6e6] bg-white text-[#615d59]"
            }`}
          >
            {preset}분
          </button>
        ))}
      </div>
      <p
        className={`font-semibold tabular-nums ${
          compact ? "text-4xl" : "py-4 text-center text-6xl"
        }`}
        aria-live="polite"
      >
        {formatTime(seconds)}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setRunning((current) => !current)}
          disabled={seconds === 0}
          className="notion-button notion-button-primary disabled:opacity-50"
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? "잠시 멈춤" : "시작"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSeconds(minutes * 60);
            setRunning(false);
          }}
          className="notion-button"
        >
          <RotateCcw className="h-4 w-4" /> 초기화
        </button>
      </div>
    </div>
  );
}
