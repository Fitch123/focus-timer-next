import { getRankProgress } from "../../lib/ranks";

export default function RankCard({ profile }: any) {
  const { currentRank, progress, needed, isUnranked } = getRankProgress(
    profile.points,
    profile.completed_sessions,
  );

  return (
    <div className="p-6 rounded-2xl shadow bg-white space-y-4">
      <h2 className="text-xl font-semibold">Rank & Progress</h2>

      {/* Rank Title */}
      <div
        className={`text-2xl font-bold ${
          isUnranked ? "text-gray-400" : "text-black"
        }`}
      >
        {currentRank}
      </div>

      {/* Unranked State */}
      {isUnranked ? (
        <div className="text-sm text-gray-500">
          Complete {needed} more session
          {needed !== 1 && "s"} to unlock Bronze
        </div>
      ) : (
        <>
          {/* XP */}
          <div>{profile.points} XP</div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-3 rounded-full">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Next Rank Info */}
          <div className="text-sm text-gray-500">
            {needed > 0 ? `${needed} XP until next rank` : "Max Rank Achieved"}
          </div>
        </>
      )}

      {/* Streak Section */}
      <div className="flex gap-6 text-sm mt-4">
        <div>🔥 {profile.current_streak} day streak</div>
        <div>🏅 Best: {profile.longest_streak}</div>
      </div>
    </div>
  );
}
