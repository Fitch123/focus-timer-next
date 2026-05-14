"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Settings } from "lucide-react";
import { ChartNoAxesCombined } from "lucide-react";
import ProfileMenu from "./ProfileMenu";
import SettingsModal from "@/components/SettingsModal";

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onSave?: (settings: any) => Promise<void>;
}

export default function Navbar({
  user,
  onLogout,
  onOpenAuth,
  onSave,
}: NavbarProps) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <nav
      className="w-full py-4"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div
        className="mx-auto px-0 flex items-center justify-between relative pb-4 p"
        style={{ maxWidth: "calc(768px * 1.1)" }}
      >
        {/* Logo */}
        <div
          className="font-bold text-lg cursor-pointer"
          style={{ color: "var(--text)" }}
          onClick={() => router.push("/")}
        >
          FocusTimer
        </div>

        {/* Right side */}
        <div className="flex items-center gap-6">
          {/* Dashboard */}
          {user && (
            <button
              onClick={() => router.push("/dashboard")}
              className="transition hover:opacity-70 text-[var(--svg)]"
            >
              <ChartNoAxesCombined size={22} />
            </button>
          )}

          {/* Quick Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-sm font-medium transition hover:opacity-70"
          >
            <Settings size={22} className="text-[var(--svg)]" />
          </button>

          {/* Profile / Auth */}
          {user ? (
            <ProfileMenu user={user} onLogout={onLogout} onSave={onSave} />
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-lg transition hover:opacity-90 text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Sign In
            </button>
          )}
        </div>

        {/* Border */}
        <div
          className="absolute bottom-0 left-6 right-6"
          style={{ height: "0.5px", background: "rgba(0,0,0,0.08)" }}
        />
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={onSave}
      />
    </nav>
  );
}
