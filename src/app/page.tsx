"use client";

import TimerPage from "../components/TimerPage";

export default function Home() {
  return <TimerPage openLogin={() => alert("Login modal placeholder")} />;
}
