"use client";

interface ControlsProps {
  isRunning: boolean;
  setIsRunning: (value: boolean | ((prev: boolean) => boolean)) => void;
  resetTimer: () => void;
}

export default function Controls({
  isRunning,
  setIsRunning,
  resetTimer,
}: ControlsProps) {
  const toggle = () => setIsRunning((prev) => !prev);
  return (
    <>
      <button
        onClick={toggle}
        className="px-6 py-2 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
      >
        {isRunning ? "Pause" : "Start"}
      </button>
      <button
        onClick={resetTimer}
        className="px-6 py-2 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
      >
        Reset
      </button>
    </>
  );
}
