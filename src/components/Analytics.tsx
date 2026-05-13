"use client";

import { useState } from "react";
import useAnalytics from "@/hooks/useAnalytics";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Analytics() {
  const [days, setDays] = useState<7 | 30>(7);
  const [chart, setChart] = useState<"bar" | "line">("bar");

  const {
    loading,
    sessionsPerDay,
    focusTimePerDay,
    totalFocusMinutes,
    avgSessionLength,
    streak,
  } = useAnalytics(days);

  const chartData = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split("T")[0];
    return {
      date: key.slice(5),
      sessions: sessionsPerDay[key] ?? 0,
      focusTime: focusTimePerDay[key] ?? 0,
    };
  });

  if (loading)
    return (
      <p className="text-sm" style={{ color: "var(--text)" }}>
        Loading analytics...
      </p>
    );

  const activeBtn = { background: "var(--text)", color: "var(--bg)" };
  const inactiveBtn = { background: "rgba(0,0,0,0.06)", color: "var(--text)" };

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { value: `${totalFocusMinutes}m`, label: "Total Focus" },
          { value: `${streak}🔥`, label: "Day Streak" },
          { value: `${avgSessionLength}m`, label: "Avg Session" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ background: "var(--card)" }}
          >
            <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              {s.value}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Toggles */}
      <div className="flex gap-2">
        <button
          onClick={() => setDays(7)}
          className="px-3 py-1 rounded-lg text-sm transition"
          style={days === 7 ? activeBtn : inactiveBtn}
        >
          7 days
        </button>
        <button
          onClick={() => setDays(30)}
          className="px-3 py-1 rounded-lg text-sm transition"
          style={days === 30 ? activeBtn : inactiveBtn}
        >
          30 days
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setChart("bar")}
            className="px-3 py-1 rounded-lg text-sm transition"
            style={chart === "bar" ? activeBtn : inactiveBtn}
          >
            Bar
          </button>
          <button
            onClick={() => setChart("line")}
            className="px-3 py-1 rounded-lg text-sm transition"
            style={chart === "line" ? activeBtn : inactiveBtn}
          >
            Line
          </button>
        </div>
      </div>

      {/* Sessions Chart */}
      <div>
        <p
          className="text-sm font-semibold mb-2"
          style={{ color: "var(--text)" }}
        >
          Sessions per day
        </p>
        <ResponsiveContainer width="100%" height={200}>
          {chart === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--text)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--text)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "none",
                  borderRadius: 8,
                  color: "var(--text)",
                }}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar
                dataKey="sessions"
                name="Sessions"
                fill="var(--ring)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--text)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--text)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "none",
                  borderRadius: 8,
                  color: "var(--text)",
                }}
              />
              <Line
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke="var(--ring)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Focus Time Chart */}
      <div>
        <p
          className="text-sm font-semibold mb-2"
          style={{ color: "var(--text)" }}
        >
          Focus time per day (minutes)
        </p>
        <ResponsiveContainer width="100%" height={200}>
          {chart === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--text)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "none",
                  borderRadius: 8,
                  color: "var(--text)",
                }}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar
                dataKey="focusTime"
                name="Focus Time"
                fill="var(--accent)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--text)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "none",
                  borderRadius: 8,
                  color: "var(--text)",
                }}
              />
              <Line
                type="monotone"
                dataKey="focusTime"
                name="Focus Time"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
