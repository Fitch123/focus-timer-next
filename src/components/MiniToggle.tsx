"use client";

interface MiniToggleProps {
  isMini: boolean;
  setIsMini: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export default function MiniToggle({ isMini, setIsMini }: MiniToggleProps) {
  return (
    <button
      onClick={() => setIsMini((prev) => !prev)}
      className="text-xs text-gray-400 hover:text-gray-600"
    >
      {isMini ? "Exit mini" : "Mini mode"}
    </button>
  );
}
