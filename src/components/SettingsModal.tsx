"use client";

import { useEffect } from "react";
import { useTimerSettings } from "@/context/TimerSettingsContext";
import QuickSettings from "./QuickSettings";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: any) => Promise<void>;
  children?: React.ReactNode;
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { saveSettings } = useTimerSettings();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative rounded-xl shadow-xl w-full max-w-sm p-6"
        style={{
          background: "var(--card)",
          boxShadow: "var(--shadow)",
        }}
      >
        <QuickSettings onClose={onClose} />
      </div>
    </div>
  );
}
