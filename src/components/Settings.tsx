"use client";

type Props = {
  isRunning: boolean;
  rankMode: boolean;
  isTransitioning: boolean;
  increaseFocus: () => void;
  decreaseFocus: () => void;
  increaseBreak: () => void;
  decreaseBreak: () => void;
};

export default function Settings({
  isRunning,
  rankMode,
  isTransitioning,
  increaseFocus,
  decreaseFocus,
  increaseBreak,
  decreaseBreak,
}: Props) {
  return (
    <div className="flex flex-col gap-3 mt-6">
      {/* Focus */}
      <div className="flex items-center gap-3">
        <span className="w-16 font-semibold">Focus</span>

        <button
          disabled={isRunning || isTransitioning}
          onClick={decreaseFocus}
          className="px-3 py-1 rounded bg-gray-700 text-white
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          −
        </button>

        <button
          disabled={isRunning || isTransitioning}
          onClick={increaseFocus}
          className="px-3 py-1 rounded bg-gray-700 text-white
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      {/* Break */}
      <div className="flex items-center gap-3">
        <span className="w-16 font-semibold">Break</span>

        <button
          disabled={isRunning || isTransitioning}
          onClick={decreaseBreak}
          className="px-3 py-1 rounded bg-gray-700 text-white
             disabled:opacity-40 disabled:cursor-not-allowed"
        >
          −
        </button>

        <button
          disabled={isRunning || isTransitioning}
          onClick={increaseBreak}
          className="px-3 py-1 rounded bg-gray-700 text-white
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
}
