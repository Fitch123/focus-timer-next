"use client";

type Props = {
  isRunning: boolean;
  increaseFocus: () => void;
  decreaseFocus: () => void;
  increaseBreak: () => void;
  decreaseBreak: () => void;
};

export default function Settings({
  isRunning,
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
          disabled={isRunning}
          onClick={decreaseFocus}
          className="px-3 py-1 rounded bg-gray-700 text-white
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          −
        </button>

        <button
          disabled={isRunning}
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
          disabled={isRunning}
          onClick={decreaseBreak}
          className="px-3 py-1 rounded bg-gray-700 text-white
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          −
        </button>

        <button
          disabled={isRunning}
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
